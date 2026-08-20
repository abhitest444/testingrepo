/* eslint-disable */
import { AppFoundations_CustomDimensionDefinition, AppFoundations_CustomDimensionValue, AppFoundations_CustomFieldDefinition, AppFoundations_CustomFieldDefinitionDropDownOption, BusinessTransaction_Department, Commerce_ProductVariant, Commerce_QbVendor, Commerce_Vendor, Common_BooleanFilter, Common_ContactEmailAddress, Common_ContactPhoneNumber, Common_ContactVariation, Common_ContactVariationInput, Common_Error, Common_ErrorExtension, Common_ErrorResponse, Common_GeoLocation, Common_GeoLocationInput, Common_IdsFilter, Common_Location, Common_Metadata, Common_MoneyAmount, Common_MoneyAmountInput, Common_PageInfo, Common_PostalAddressSimple, Common_SuccessResponse, Common_Verification, Common_VerificationInput, CustomerLifeCycle_Customer, DataAccess_Contact, DataAccess_Department, DataAccess_Klass, DataAccess_Product, Mutation, Payroll_EmployeeCompensation, Payroll_EmployerBreak, ProjectManagement_Project, Qb_AlternateId, Query, TimeTrackingUpdateSetting_IntegerInput, TimeTrackingUpdateSetting_StringInput, TimeTracking_AlternateIdsFilter, TimeTracking_ApprovalBaseReminderSettings, TimeTracking_ApprovalReminder, TimeTracking_ApprovalReminderBasisSetting, TimeTracking_ApprovalReminderDaysOfWeek, TimeTracking_ApprovalReminderDaysOfWeekInput, TimeTracking_ApprovalSettings, TimeTracking_ApprovalSubmissionNotificationSettings, TimeTracking_ApprovalSubmissionNotificationSettingsInput, TimeTracking_AssignGroupManagersError, TimeTracking_AssignGroupManagersInput, TimeTracking_AssignGroupManagersPayload, TimeTracking_AssignGroupMembersError, TimeTracking_AssignGroupMembersInput, TimeTracking_AssignGroupMembersPayload, TimeTracking_AssignedCustomer, TimeTracking_AssignedGroup, TimeTracking_AssignedStandardField, TimeTracking_AssignedWorker, TimeTracking_AssignmentItemError, TimeTracking_AttachmentInfo, TimeTracking_AttachmentInfoConnection, TimeTracking_AttachmentInfoEdge, TimeTracking_AttachmentMetaData, TimeTracking_AttachmentsInputFilter, TimeTracking_AttachmentsMutationError, TimeTracking_BatchCreateUpdateTimeEntryInput, TimeTracking_BatchManageDeleteTimeEntryInput, TimeTracking_BatchManageTimeEntriesError, TimeTracking_BatchManageTimeEntriesInput, TimeTracking_BatchManageTimeEntriesPayload, TimeTracking_ClockInOutRoundingSettings, TimeTracking_ClockInOutRoundingSettingsInput, TimeTracking_ClockOutOverrideNotificationSettings, TimeTracking_ContentAttachment, TimeTracking_CoreEmployerSettings, TimeTracking_CoreEmployerSettingsInput, TimeTracking_CreateAttachmentInput, TimeTracking_CreateAttachmentsInput, TimeTracking_CreateAttachmentsPayload, TimeTracking_CreateFlagInput, TimeTracking_CreateFlagMapsInput, TimeTracking_CreateFlagMapsPayload, TimeTracking_CreateFlagPayload, TimeTracking_CreateGroupError, TimeTracking_CreateGroupInput, TimeTracking_CreateGroupPayload, TimeTracking_CreateLocationPointInput, TimeTracking_CreateLocationPointsError, TimeTracking_CreateLocationPointsInput, TimeTracking_CreateLocationPointsPayload, TimeTracking_CreateOvertimeNotificationRuleInput, TimeTracking_CreateProjectEstimateError, TimeTracking_CreateProjectEstimateInput, TimeTracking_CreateProjectEstimatePayload, TimeTracking_CreateTimeEntryError, TimeTracking_CreateTimeEntryInput, TimeTracking_CreateTimeEntryPayload, TimeTracking_CreatedLocationPoints, TimeTracking_CustomDimension, TimeTracking_CustomDimensionEdge, TimeTracking_CustomDimensionNode, TimeTracking_CustomDimensionSetting, TimeTracking_CustomDimensionsConnection, TimeTracking_CustomDimensionsFilter, TimeTracking_CustomExtensionDimension, TimeTracking_CustomExtensionDimensionInput, TimeTracking_CustomExtensions, TimeTracking_CustomExtensionsInput, TimeTracking_CustomField, TimeTracking_CustomFieldAssignment, TimeTracking_CustomFieldAssignmentEdge, TimeTracking_CustomFieldAssignmentsConnection, TimeTracking_CustomFieldAssignmentsFilter, TimeTracking_CustomFieldAssignmentsInput, TimeTracking_CustomFieldAssignmentsQueryInput, TimeTracking_CustomFieldDefinition, TimeTracking_CustomFieldDefinitionConnection, TimeTracking_CustomFieldDefinitionEdge, TimeTracking_CustomFieldInput, TimeTracking_CustomFieldOption, TimeTracking_CustomFieldOptionAssignment, TimeTracking_CustomFieldOptionAssignmentConnection, TimeTracking_CustomFieldOptionAssignmentDetails, TimeTracking_CustomFieldOptionAssignmentEdge, TimeTracking_CustomFieldOptionAssignmentsFilter, TimeTracking_CustomFieldOptionAssignmentsQueryInput, TimeTracking_CustomFieldsInputFilter, TimeTracking_CustomerTimeSummary, TimeTracking_CustomerTimeSummaryConnection, TimeTracking_CustomerTimeSummaryDuration, TimeTracking_CustomerTimeSummaryEdge, TimeTracking_CustomerTimeSummaryFilter, TimeTracking_CustomerTimeSummaryInput, TimeTracking_DailyApprovalReminder, TimeTracking_DailyApprovalReminderDetails, TimeTracking_DailyApprovalReminderDetailsInput, TimeTracking_DailyApprovalReminderInput, TimeTracking_DatePeriod, TimeTracking_DeleteAttachmentsInput, TimeTracking_DeleteAttachmentsPayload, TimeTracking_DeleteGroupError, TimeTracking_DeleteGroupInput, TimeTracking_DeleteGroupPayload, TimeTracking_DeletePostError, TimeTracking_DeletePostInput, TimeTracking_DeletePostPayload, TimeTracking_DeleteProjectEstimateError, TimeTracking_DeleteProjectEstimateInput, TimeTracking_DeleteProjectEstimatePayload, TimeTracking_DeleteTimeEntryError, TimeTracking_DeleteTimeEntryInput, TimeTracking_DeleteTimeEntryPayload, TimeTracking_DistanceTracking, TimeTracking_DistanceTrackingUpdateInput, TimeTracking_EffectiveUserSettings, TimeTracking_EmployeeApprovalReminder, TimeTracking_EmployeeApprovalReminderInput, TimeTracking_EmployeeApprovalSettings, TimeTracking_EmployeeApprovalSettingsInput, TimeTracking_EmployeeDailyReminderInputSettings, TimeTracking_EmployerSettings, TimeTracking_EmployerSettingsInput, TimeTracking_FeaturePermissions, TimeTracking_FeaturePermissionsInput, TimeTracking_FieldOptionEstimate, TimeTracking_FieldOptionEstimateInput, TimeTracking_FieldOptionEstimatesConnection, TimeTracking_FieldOptionEstimatesEdge, TimeTracking_Flag, TimeTracking_FlagEntityInput, TimeTracking_FlagError, TimeTracking_FlagMap, TimeTracking_GeofenceConfiguration, TimeTracking_GeofenceConfigurationConnection, TimeTracking_GeofenceConfigurationEdge, TimeTracking_GeofenceConfigurationInput, TimeTracking_GeofenceEmployerSettings, TimeTracking_GeofenceEmployerSettingsInput, TimeTracking_GeofenceLocation, TimeTracking_GeofenceRadiusInput, TimeTracking_GeofenceRadiusResult, TimeTracking_GeofenceReminderDaysOfWeek, TimeTracking_GeofenceReminderDaysOfWeekInput, TimeTracking_GeofenceReminderSettings, TimeTracking_Group, TimeTracking_GroupConnection, TimeTracking_GroupEdge, TimeTracking_GroupFilter, TimeTracking_GroupManagerAssignmentError, TimeTracking_GroupManagerAssignmentSuccess, TimeTracking_GroupManagerRemovalError, TimeTracking_GroupManagerRemovalSuccess, TimeTracking_GroupMemberAssignmentError, TimeTracking_GroupMemberAssignmentSuccess, TimeTracking_GroupMemberRemovalError, TimeTracking_GroupMemberRemovalSuccess, TimeTracking_GroupMeta, TimeTracking_GroupProfile, TimeTracking_GroupStats, TimeTracking_KioskEmployerSettings, TimeTracking_KioskEmployerSettingsInput, TimeTracking_LegacyQboUser, TimeTracking_LocationDetail, TimeTracking_LocationDetailConnection, TimeTracking_LocationDetailEdge, TimeTracking_LocationDetailsInput, TimeTracking_LocationMetaData, TimeTracking_LocationPoint, TimeTracking_ManageCustomFieldAssignmentError, TimeTracking_ManageCustomFieldAssignmentInput, TimeTracking_ManageCustomFieldAssignmentPayload, TimeTracking_ManageCustomFieldInput, TimeTracking_ManageCustomFieldOptionAssignmentError, TimeTracking_ManageCustomFieldOptionAssignmentInput, TimeTracking_ManageCustomFieldOptionAssignmentPayload, TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError, TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentInput, TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentPayload, TimeTracking_ManageCustomFieldToCustomerAssignmentError, TimeTracking_ManageCustomFieldToCustomerAssignmentPayload, TimeTracking_ManageCustomFieldsError, TimeTracking_ManageCustomFieldsInput, TimeTracking_ManageCustomFieldsPayload, TimeTracking_ManagePostError, TimeTracking_ManagePostInput, TimeTracking_ManagePostPayload, TimeTracking_ManageStandardFieldAssignmentError, TimeTracking_ManageStandardFieldAssignmentInput, TimeTracking_ManageStandardFieldAssignmentPayload, TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError, TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentInput, TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentPayload, TimeTracking_ManageStandardFieldOptionTimeForAssignmentError, TimeTracking_ManageStandardFieldOptionTimeForAssignmentInput, TimeTracking_ManageStandardFieldOptionTimeForAssignmentPayload, TimeTracking_ManageTimeAgainstCustomFieldAssignmentError, TimeTracking_ManageTimeAgainstCustomFieldAssignmentPayload, TimeTracking_ManageTimeAgainstFieldAssignmentError, TimeTracking_ManageTimeAgainstFieldAssignmentInput, TimeTracking_ManageTimeAgainstFieldAssignmentPayload, TimeTracking_ManageTimeAgainstStandardFieldAssignmentError, TimeTracking_ManageTimeAgainstStandardFieldAssignmentPayload, TimeTracking_ManageTimeAgainstTimeForAssignmentError, TimeTracking_ManageTimeAgainstTimeForAssignmentInput, TimeTracking_ManageTimeAgainstTimeForAssignmentPayload, TimeTracking_ManageUnifiedUserSettingsError, TimeTracking_ManageUnifiedUserSettingsInput, TimeTracking_ManageUnifiedUserSettingsPayload, TimeTracking_ManageUserSettingsError, TimeTracking_ManageUserSettingsInput, TimeTracking_ManageUserSettingsPayload, TimeTracking_ManagementPermissions, TimeTracking_ManagementPermissionsInput, TimeTracking_ManagerApprovalReminder, TimeTracking_ManagerApprovalReminderInput, TimeTracking_ManagerApprovalSettings, TimeTracking_ManagerApprovalSettingsInput, TimeTracking_MarkPostsReadError, TimeTracking_MarkPostsReadInput, TimeTracking_MarkPostsReadPayload, TimeTracking_MutationError, TimeTracking_MutationSuccess, TimeTracking_NearbyCustomersConnection, TimeTracking_NearbyCustomersEdge, TimeTracking_NearbyCustomersInput, TimeTracking_NearbyCustomersNode, TimeTracking_NotificationEmployerSettings, TimeTracking_NotificationEmployerSettingsInput, TimeTracking_NotificationSubscription, TimeTracking_NotificationSubscriptionInput, TimeTracking_OvertimeAlertFrequency, TimeTracking_OvertimeAlertFrequencyInput, TimeTracking_OvertimeAlertRecipients, TimeTracking_OvertimeAlertRecipientsInput, TimeTracking_OvertimeNotificationRule, TimeTracking_OvertimeNotificationSettings, TimeTracking_OvertimeRuleAssignment, TimeTracking_OvertimeThreshold, TimeTracking_OvertimeThresholdInput, TimeTracking_PageMeta, TimeTracking_PartialBatchManageTimeEntriesPayload, TimeTracking_PartialCustomFieldAssignmentPayload, TimeTracking_PartialCustomFieldOptionAssignmentPayload, TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload, TimeTracking_PartialStandardFieldAssignmentPayload, TimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload, TimeTracking_PartialStandardFieldOptionTimeForAssignmentPayload, TimeTracking_PartialTimeAgainstCustomFieldAssignmentPayload, TimeTracking_PartialTimeAgainstFieldAssignmentPayload, TimeTracking_PartialTimeAgainstStandardFieldAssignmentPayload, TimeTracking_PartialTimeAgainstTimeForAssignmentPayload, TimeTracking_PayPeriodApprovalReminder, TimeTracking_PayPeriodApprovalReminderDetails, TimeTracking_PayPeriodApprovalReminderDetailsInput, TimeTracking_PayPeriodApprovalReminderInput, TimeTracking_PayrollEmployeeCompensationBreakdownByTags, TimeTracking_PayrollEmployeeCompensationDetails, TimeTracking_PayrollEmployeeData, TimeTracking_PayrollEmployeeDataConnection, TimeTracking_PayrollEmployeeDataEdge, TimeTracking_PayrollEmployeeDataInputFilter, TimeTracking_Post, TimeTracking_PostMention, TimeTracking_PostMeta, TimeTracking_PostProjectRefsInput, TimeTracking_PostsConnection, TimeTracking_PostsEdge, TimeTracking_PostsFilter, TimeTracking_PostsInput, TimeTracking_PostsUnreadCountInput, TimeTracking_PostsUnreadCountResult, TimeTracking_ProjectEstimate, TimeTracking_ProjectEstimateProjectRefInput, TimeTracking_ProjectEstimatesConnection, TimeTracking_ProjectEstimatesEdge, TimeTracking_ProjectEstimatesInput, TimeTracking_RemoveGroupManagersError, TimeTracking_RemoveGroupManagersInput, TimeTracking_RemoveGroupManagersPayload, TimeTracking_RemoveGroupMembersError, TimeTracking_RemoveGroupMembersInput, TimeTracking_RemoveGroupMembersPayload, TimeTracking_ResetUserSettingsError, TimeTracking_ResetUserSettingsInput, TimeTracking_ResetUserSettingsPayload, TimeTracking_ScheduleEmployerSettings, TimeTracking_ScheduleEmployerSettingsInput, TimeTracking_ScheduleNotificationSettings, TimeTracking_SchedulePermissions, TimeTracking_SchedulePermissionsInput, TimeTracking_ServiceItemSaleDetails, TimeTracking_SettingBoolean, TimeTracking_SettingDaysOfWeek, TimeTracking_SettingInteger, TimeTracking_SettingLocationTracking, TimeTracking_SettingMeta, TimeTracking_SettingNotificationMedium, TimeTracking_SettingNotificationReminderDays, TimeTracking_SettingScheduleManagePreference, TimeTracking_SettingScheduleShiftChangeNotificationPreference, TimeTracking_SettingScheduleViewPreference, TimeTracking_SettingString, TimeTracking_ShiftNotificationSettings, TimeTracking_StandardField, TimeTracking_StandardFieldAssignment, TimeTracking_StandardFieldAssignmentEdge, TimeTracking_StandardFieldAssignmentSummary, TimeTracking_StandardFieldAssignmentSummaryConnection, TimeTracking_StandardFieldAssignmentSummaryEdge, TimeTracking_StandardFieldAssignmentsConnection, TimeTracking_StandardFieldAssignmentsFilter, TimeTracking_StandardFieldAssignmentsInput, TimeTracking_StandardFieldAssignmentsQueryInput, TimeTracking_StandardFieldOptionAssignment, TimeTracking_StandardFieldOptionAssignmentConnection, TimeTracking_StandardFieldOptionAssignmentEdge, TimeTracking_StandardFieldOptionAssignmentsFilter, TimeTracking_StandardFieldOptionAssignmentsQueryInput, TimeTracking_StandardFieldOptionSummary, TimeTracking_StandardFieldOptionSummaryConnection, TimeTracking_StandardFieldOptionSummaryEdge, TimeTracking_StandardFieldOptionSummaryFilter, TimeTracking_SubmitWorkerTimeError, TimeTracking_SubmitWorkerTimeInput, TimeTracking_SubmitWorkerTimePayload, TimeTracking_TimeAgainst, TimeTracking_TimeAgainstAssignment, TimeTracking_TimeAgainstAssignmentConnection, TimeTracking_TimeAgainstAssignmentEdge, TimeTracking_TimeAgainstAssignmentSummary, TimeTracking_TimeAgainstAssignmentSummaryConnection, TimeTracking_TimeAgainstAssignmentSummaryEdge, TimeTracking_TimeAgainstAssignmentSummaryFilter, TimeTracking_TimeAgainstAssignmentsFilter, TimeTracking_TimeAgainstAssignmentsInput, TimeTracking_TimeAgainstAssignmentsQueryInput, TimeTracking_TimeAgainstConnection, TimeTracking_TimeAgainstEdge, TimeTracking_TimeAgainstInput, TimeTracking_TimeAgainstShippingAddress, TimeTracking_TimeAndDateEmployerSettings, TimeTracking_TimeAndDateEmployerSettingsInput, TimeTracking_TimeCostSummary, TimeTracking_TimeCostSummaryConnection, TimeTracking_TimeCostSummaryEdge, TimeTracking_TimeCostSummaryFilter, TimeTracking_TimeCostSummaryInput, TimeTracking_TimeEntriesConnection, TimeTracking_TimeEntriesEdge, TimeTracking_TimeEntriesInput, TimeTracking_TimeEntry, TimeTracking_TimeEntryDeviceAttributes, TimeTracking_TimeEntryFilter, TimeTracking_TimeEntryInput, TimeTracking_TimeEntryMeta, TimeTracking_TimeEntryOrderBy, TimeTracking_TimeEntrySource, TimeTracking_TimeForAssignment, TimeTracking_TimeForAssignmentEdge, TimeTracking_TimeForAssignmentsConnection, TimeTracking_TimeForAssignmentsFilter, TimeTracking_TimeForAssignmentsInput, TimeTracking_TimeForAssignmentsQueryInput, TimeTracking_TimeForInput, TimeTracking_TimeSheetCustomFieldsSettings, TimeTracking_TimeSheetNotesSettings, TimeTracking_TimeSheetSettings, TimeTracking_TimesheetEditNotificationSettings, TimeTracking_TimesheetManagementEmployerSettings, TimeTracking_TimesheetManagementEmployerSettingsInput, TimeTracking_TimesheetRoundingEmployerSettings, TimeTracking_TimesheetRoundingEmployerSettingsInput, TimeTracking_TimesheetUpdateEmployerSettingsInput, TimeTracking_TimesheetUpdateNotesSettingsInput, TimeTracking_TotalDurationByDate, TimeTracking_TotalDurationByDateConnection, TimeTracking_TotalDurationByDateEdge, TimeTracking_TotalDurationByDateFilter, TimeTracking_TotalDurationByDateInput, TimeTracking_TotalDurationByDateOrderBy, TimeTracking_TotalDurationByTimeWindow, TimeTracking_TotalDurationByTimeWindowInput, TimeTracking_TrackTimeAgainst, TimeTracking_TrackTimeAgainstContact, TimeTracking_TrackTimeAgainstInput, TimeTracking_TrackTimeAgainstNode, TimeTracking_UnifiedUserLocationTracking, TimeTracking_UnifiedUserOvertimeNotificationSettings, TimeTracking_UnifiedUserScheduleNotificationSettings, TimeTracking_UnifiedUserSettings, TimeTracking_UnifiedUserSettingsInput, TimeTracking_UpdateApprovalSettingsError, TimeTracking_UpdateApprovalSettingsInput, TimeTracking_UpdateApprovalSettingsPayload, TimeTracking_UpdateAttachmentInput, TimeTracking_UpdateAttachmentsInput, TimeTracking_UpdateAttachmentsPayload, TimeTracking_UpdateClockOutOverrideNotificationSettingsInput, TimeTracking_UpdateCustomDimensionSettingInput, TimeTracking_UpdateCustomFieldsSettingsInput, TimeTracking_UpdateEmployerSettingsError, TimeTracking_UpdateEmployerSettingsInput, TimeTracking_UpdateEmployerSettingsPayload, TimeTracking_UpdateGeofenceConfigurationError, TimeTracking_UpdateGeofenceConfigurationInput, TimeTracking_UpdateGeofenceConfigurationPayload, TimeTracking_UpdateGeofenceLocationInput, TimeTracking_UpdateGeofenceReminderSettingsInput, TimeTracking_UpdateGroupError, TimeTracking_UpdateGroupInput, TimeTracking_UpdateGroupPayload, TimeTracking_UpdateOvertimeNotificationRuleInput, TimeTracking_UpdateOvertimeNotificationSettingsInput, TimeTracking_UpdateProjectEstimateError, TimeTracking_UpdateProjectEstimateInput, TimeTracking_UpdateProjectEstimatePayload, TimeTracking_UpdateScheduleNotificationSettingsInput, TimeTracking_UpdateSettingApprovalReminderBasisInput, TimeTracking_UpdateSettingApprovalReminderMediumInput, TimeTracking_UpdateSettingBooleanInput, TimeTracking_UpdateSettingDayInput, TimeTracking_UpdateSettingIntegerInput, TimeTracking_UpdateSettingLocationTrackingInput, TimeTracking_UpdateSettingNotificationMediumInput, TimeTracking_UpdateSettingNotificationReminderDaysInput, TimeTracking_UpdateSettingScheduleManageInput, TimeTracking_UpdateSettingScheduleShiftChangePreferenceInput, TimeTracking_UpdateSettingScheduleViewInput, TimeTracking_UpdateSettingStringInput, TimeTracking_UpdateShiftNotificationSettingsInput, TimeTracking_UpdateTimeEntryError, TimeTracking_UpdateTimeEntryInput, TimeTracking_UpdateTimeEntryPayload, TimeTracking_UpdateTimeSheetEditNotificationSettingsInput, TimeTracking_UpdateUnifiedUserScheduleNotificationSettingsInput, TimeTracking_UpdateUserLocationTrackingInput, TimeTracking_UpdateWorkerPermissionsError, TimeTracking_UpdateWorkerPermissionsInput, TimeTracking_UpdateWorkerPermissionsPayload, TimeTracking_UserSettingNotificationReminderDays, TimeTracking_UserSettings, TimeTracking_UserSettingsInput, TimeTracking_UserShiftNotificationSettings, TimeTracking_V3BillableStatusFilter, TimeTracking_V3BooleanFilter, TimeTracking_V3BreakDurationDetails, TimeTracking_V3BreakDurationDetailsInput, TimeTracking_V3DateFilter, TimeTracking_V3DateTimeFilter, TimeTracking_V3DecimalFilter, TimeTracking_V3DurationDetails, TimeTracking_V3DurationDetailsInput, TimeTracking_V3IdFilter, TimeTracking_V3IntFilter, TimeTracking_WeeklyApprovalReminder, TimeTracking_WeeklyApprovalReminderDetails, TimeTracking_WeeklyApprovalReminderDetailsInput, TimeTracking_WeeklyApprovalReminderInput, TimeTracking_WhoIsWorkingConnection, TimeTracking_WhoIsWorkingEdge, TimeTracking_WhoIsWorkingFilter, TimeTracking_WhoIsWorkingOrderBy, TimeTracking_WhoIsWorkingSummary, TimeTracking_WhoIsWorkingWorker, TimeTracking_Worker, TimeTracking_WorkerConnection, TimeTracking_WorkerEdge, TimeTracking_WorkerPermissions, TimeTracking_WorkerPermissionsInput, TimeTracking_WorkerQueryFilter, TimeTracking_WorkerSubmitTimeDates, TimeTracking_WorkerTimeSummary, TimeTracking_WorkerTimeSummaryConnection, TimeTracking_WorkerTimeSummaryEdge, TimeTracking_WorkerTimeSummaryFilter, TimeTracking_WorkerTimeSummaryInput, TimeTracking_WorkersQueryFilter, TimeTracking_WorkersWithTimeEntries, TimeTracking_WorkersWithTimeEntriesConnection, TimeTracking_WorkersWithTimeEntriesEdge, TimeTracking_WorkersWithTimeEntriesFilter, TimeTracking_WorkersWithTimeEntriesInput, WorkerManagement_Employee, Common_ContactPurpose, Common_ContactUsage, Common_CountryCode, Common_CurrencyCode, Common_DayOfWeek, Common_ErrorType, Common_Ordinal, Common_PhoneKind, Common_SortOrder, Common_VerificationMethod, Common_VerificationStatus, Common_VerificationType, TimeTracking_ApprovalReminderBasis, TimeTracking_ApprovalStatusType, TimeTracking_BillableStatus, TimeTracking_CustomerTimeSummaryOrderBy, TimeTracking_EntryMethodType, TimeTracking_FieldType, TimeTracking_FlagEntityType, TimeTracking_FlagType, TimeTracking_GroupOrderBy, TimeTracking_LocationTrackingType, TimeTracking_NotificationReminderMedium, TimeTracking_NotificationType, TimeTracking_OvertimePeriod, TimeTracking_OvertimeRuleEntityType, TimeTracking_PostType, TimeTracking_ProjectEstimateType, TimeTracking_ProjectPermission, TimeTracking_ReadTrackingEntityType, TimeTracking_ScheduleLevel, TimeTracking_ScheduleManagePreference, TimeTracking_ScheduleShiftChangeNotificationPreference, TimeTracking_ScheduleViewPreference, TimeTracking_TimeAgainstOrderOn, TimeTracking_TimeCostSummaryGroupBy, TimeTracking_TimeEntryOrderOn, TimeTracking_TimeForType, TimeTracking_TimeOffCategoryType, TimeTracking_TotalDurationByDateOrderOn, TimeTracking_TotalDurationTimeWindow, TimeTracking_UserLocationTrackingType, TimeTracking_UserSettingsForReset, TimeTracking_V3TransactionLocationType, TimeTracking_WhoIsWorkingOrderOn, TimeTracking_WorkerOrderBy, TimeTracking_WorkerTimeSummaryOrderBy } from 'src/__generated__/timeTracking/graphql';

export const anAppFoundations_CustomDimensionDefinition = (overrides?: Partial<AppFoundations_CustomDimensionDefinition>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'AppFoundations_CustomDimensionDefinition' } & AppFoundations_CustomDimensionDefinition => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('AppFoundations_CustomDimensionDefinition');
    return {
        __typename: 'AppFoundations_CustomDimensionDefinition',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'fd6f9a55-905a-4864-a159-736ed2816fc2',
    };
};

export const anAppFoundations_CustomDimensionValue = (overrides?: Partial<AppFoundations_CustomDimensionValue>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'AppFoundations_CustomDimensionValue' } & AppFoundations_CustomDimensionValue => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('AppFoundations_CustomDimensionValue');
    return {
        __typename: 'AppFoundations_CustomDimensionValue',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '9f85bab4-c201-4d03-83d5-570dae9105c8',
    };
};

export const anAppFoundations_CustomFieldDefinition = (overrides?: Partial<AppFoundations_CustomFieldDefinition>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'AppFoundations_CustomFieldDefinition' } & AppFoundations_CustomFieldDefinition => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('AppFoundations_CustomFieldDefinition');
    return {
        __typename: 'AppFoundations_CustomFieldDefinition',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '533eb2df-93e4-4592-b4b4-20f7d1527b32',
    };
};

export const anAppFoundations_CustomFieldDefinitionDropDownOption = (overrides?: Partial<AppFoundations_CustomFieldDefinitionDropDownOption>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'AppFoundations_CustomFieldDefinitionDropDownOption' } & AppFoundations_CustomFieldDefinitionDropDownOption => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('AppFoundations_CustomFieldDefinitionDropDownOption');
    return {
        __typename: 'AppFoundations_CustomFieldDefinitionDropDownOption',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'c3b41cfd-5223-4d2d-aea6-b2c4c6b46baa',
    };
};

export const aBusinessTransaction_Department = (overrides?: Partial<BusinessTransaction_Department>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'BusinessTransaction_Department' } & BusinessTransaction_Department => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('BusinessTransaction_Department');
    return {
        __typename: 'BusinessTransaction_Department',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'bfd50915-7bbd-45ec-bd39-2ee1a456906c',
    };
};

export const aCommerce_ProductVariant = (overrides?: Partial<Commerce_ProductVariant>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Commerce_ProductVariant' } & Commerce_ProductVariant => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Commerce_ProductVariant');
    return {
        __typename: 'Commerce_ProductVariant',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'dc86a4f2-6c5b-4c75-a2bf-0971b0d8363a',
    };
};

export const aCommerce_QbVendor = (overrides?: Partial<Commerce_QbVendor>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Commerce_QbVendor' } & Commerce_QbVendor => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Commerce_QbVendor');
    return {
        __typename: 'Commerce_QbVendor',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '99fc50f3-a19f-4df6-9e17-4482d4f29df0',
    };
};

export const aCommerce_Vendor = (overrides?: Partial<Commerce_Vendor>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Commerce_Vendor' } & Commerce_Vendor => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Commerce_Vendor');
    return {
        __typename: 'Commerce_Vendor',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '8910a5b1-25ec-49fd-9c24-e8fade3e1995',
    };
};

export const aCommon_BooleanFilter = (overrides?: Partial<Common_BooleanFilter>, _relationshipsToOmit: Set<string> = new Set()): Common_BooleanFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_BooleanFilter');
    return {
        equals: overrides && overrides.hasOwnProperty('equals') ? overrides.equals! : true,
        notEqual: overrides && overrides.hasOwnProperty('notEqual') ? overrides.notEqual! : true,
    };
};

export const aCommon_ContactEmailAddress = (overrides?: Partial<Common_ContactEmailAddress>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Common_ContactEmailAddress' } & Common_ContactEmailAddress => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_ContactEmailAddress');
    return {
        __typename: 'Common_ContactEmailAddress',
        email: overrides && overrides.hasOwnProperty('email') ? overrides.email! : 'cupiditate',
        variation: overrides && overrides.hasOwnProperty('variation') ? overrides.variation! : relationshipsToOmit.has('Common_ContactVariation') ? {} as Common_ContactVariation : aCommon_ContactVariation({}, relationshipsToOmit),
        verification: overrides && overrides.hasOwnProperty('verification') ? overrides.verification! : relationshipsToOmit.has('Common_Verification') ? {} as Common_Verification : aCommon_Verification({}, relationshipsToOmit),
    };
};

export const aCommon_ContactPhoneNumber = (overrides?: Partial<Common_ContactPhoneNumber>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Common_ContactPhoneNumber' } & Common_ContactPhoneNumber => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_ContactPhoneNumber');
    return {
        __typename: 'Common_ContactPhoneNumber',
        e164Number: overrides && overrides.hasOwnProperty('e164Number') ? overrides.e164Number! : 'aut',
        kind: overrides && overrides.hasOwnProperty('kind') ? overrides.kind! : Common_PhoneKind.Fax,
        originalNumber: overrides && overrides.hasOwnProperty('originalNumber') ? overrides.originalNumber! : 'modi',
        variation: overrides && overrides.hasOwnProperty('variation') ? overrides.variation! : relationshipsToOmit.has('Common_ContactVariation') ? {} as Common_ContactVariation : aCommon_ContactVariation({}, relationshipsToOmit),
        verification: overrides && overrides.hasOwnProperty('verification') ? overrides.verification! : relationshipsToOmit.has('Common_Verification') ? {} as Common_Verification : aCommon_Verification({}, relationshipsToOmit),
    };
};

export const aCommon_ContactVariation = (overrides?: Partial<Common_ContactVariation>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Common_ContactVariation' } & Common_ContactVariation => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_ContactVariation');
    return {
        __typename: 'Common_ContactVariation',
        Common_Ordinal: overrides && overrides.hasOwnProperty('Common_Ordinal') ? overrides.Common_Ordinal! : Common_Ordinal.Other,
        purpose: overrides && overrides.hasOwnProperty('purpose') ? overrides.purpose! : Common_ContactPurpose.Billing,
        usage: overrides && overrides.hasOwnProperty('usage') ? overrides.usage! : Common_ContactUsage.Alternate,
    };
};

export const aCommon_ContactVariationInput = (overrides?: Partial<Common_ContactVariationInput>, _relationshipsToOmit: Set<string> = new Set()): Common_ContactVariationInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_ContactVariationInput');
    return {
        Common_Ordinal: overrides && overrides.hasOwnProperty('Common_Ordinal') ? overrides.Common_Ordinal! : Common_Ordinal.Other,
        purpose: overrides && overrides.hasOwnProperty('purpose') ? overrides.purpose! : Common_ContactPurpose.Billing,
        usage: overrides && overrides.hasOwnProperty('usage') ? overrides.usage! : Common_ContactUsage.Alternate,
    };
};

export const aCommon_Error = (overrides?: Partial<Common_Error>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Common_Error' } & Common_Error => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_Error');
    return {
        __typename: 'Common_Error',
        extensions: overrides && overrides.hasOwnProperty('extensions') ? overrides.extensions! : relationshipsToOmit.has('Common_ErrorExtension') ? {} as Common_ErrorExtension : aCommon_ErrorExtension({}, relationshipsToOmit),
        locations: overrides && overrides.hasOwnProperty('locations') ? overrides.locations! : [relationshipsToOmit.has('Common_Location') ? {} as Common_Location : aCommon_Location({}, relationshipsToOmit)],
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'velit',
        path: overrides && overrides.hasOwnProperty('path') ? overrides.path! : ['nam'],
    };
};

export const aCommon_ErrorExtension = (overrides?: Partial<Common_ErrorExtension>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Common_ErrorExtension' } & Common_ErrorExtension => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_ErrorExtension');
    return {
        __typename: 'Common_ErrorExtension',
        debugInfo: overrides && overrides.hasOwnProperty('debugInfo') ? overrides.debugInfo! : 'optio',
        debugUri: overrides && overrides.hasOwnProperty('debugUri') ? overrides.debugUri! : 'atque',
        errorCategory: overrides && overrides.hasOwnProperty('errorCategory') ? overrides.errorCategory! : 'ullam',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'culpa',
        errorDetail: overrides && overrides.hasOwnProperty('errorDetail') ? overrides.errorDetail! : 'voluptas',
        errorType: overrides && overrides.hasOwnProperty('errorType') ? overrides.errorType! : Common_ErrorType.BadRequest,
        origin: overrides && overrides.hasOwnProperty('origin') ? overrides.origin! : 'esse',
    };
};

export const aCommon_ErrorResponse = (overrides?: Partial<Common_ErrorResponse>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Common_ErrorResponse' } & Common_ErrorResponse => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_ErrorResponse');
    return {
        __typename: 'Common_ErrorResponse',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'qui',
    };
};

export const aCommon_GeoLocation = (overrides?: Partial<Common_GeoLocation>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Common_GeoLocation' } & Common_GeoLocation => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_GeoLocation');
    return {
        __typename: 'Common_GeoLocation',
        latitude: overrides && overrides.hasOwnProperty('latitude') ? overrides.latitude! : 'rerum',
        longitude: overrides && overrides.hasOwnProperty('longitude') ? overrides.longitude! : 'voluptas',
    };
};

export const aCommon_GeoLocationInput = (overrides?: Partial<Common_GeoLocationInput>, _relationshipsToOmit: Set<string> = new Set()): Common_GeoLocationInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_GeoLocationInput');
    return {
        latitude: overrides && overrides.hasOwnProperty('latitude') ? overrides.latitude! : 'facere',
        longitude: overrides && overrides.hasOwnProperty('longitude') ? overrides.longitude! : 'rerum',
    };
};

export const aCommon_IdsFilter = (overrides?: Partial<Common_IdsFilter>, _relationshipsToOmit: Set<string> = new Set()): Common_IdsFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_IdsFilter');
    return {
        matchesAny: overrides && overrides.hasOwnProperty('matchesAny') ? overrides.matchesAny! : ['2b85bfd8-0eca-4068-ac45-70fe89cd4abc'],
    };
};

export const aCommon_Location = (overrides?: Partial<Common_Location>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Common_Location' } & Common_Location => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_Location');
    return {
        __typename: 'Common_Location',
        column: overrides && overrides.hasOwnProperty('column') ? overrides.column! : 4075,
        line: overrides && overrides.hasOwnProperty('line') ? overrides.line! : 3166,
    };
};

export const aCommon_Metadata = (overrides?: Partial<Common_Metadata>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Common_Metadata' } & Common_Metadata => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_Metadata');
    return {
        __typename: 'Common_Metadata',
        createdAt: overrides && overrides.hasOwnProperty('createdAt') ? overrides.createdAt! : 'illo',
        createdBy: overrides && overrides.hasOwnProperty('createdBy') ? overrides.createdBy! : 'impedit',
        updatedAt: overrides && overrides.hasOwnProperty('updatedAt') ? overrides.updatedAt! : 'quisquam',
    };
};

export const aCommon_MoneyAmount = (overrides?: Partial<Common_MoneyAmount>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Common_MoneyAmount' } & Common_MoneyAmount => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_MoneyAmount');
    return {
        __typename: 'Common_MoneyAmount',
        currency: overrides && overrides.hasOwnProperty('currency') ? overrides.currency! : Common_CurrencyCode.Aed,
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : 'et',
    };
};

export const aCommon_MoneyAmountInput = (overrides?: Partial<Common_MoneyAmountInput>, _relationshipsToOmit: Set<string> = new Set()): Common_MoneyAmountInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_MoneyAmountInput');
    return {
        currency: overrides && overrides.hasOwnProperty('currency') ? overrides.currency! : Common_CurrencyCode.Aed,
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : 'eum',
    };
};

export const aCommon_PageInfo = (overrides?: Partial<Common_PageInfo>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Common_PageInfo' } & Common_PageInfo => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_PageInfo');
    return {
        __typename: 'Common_PageInfo',
        endCursor: overrides && overrides.hasOwnProperty('endCursor') ? overrides.endCursor! : 'dignissimos',
        hasNextPage: overrides && overrides.hasOwnProperty('hasNextPage') ? overrides.hasNextPage! : false,
        hasPreviousPage: overrides && overrides.hasOwnProperty('hasPreviousPage') ? overrides.hasPreviousPage! : false,
        startCursor: overrides && overrides.hasOwnProperty('startCursor') ? overrides.startCursor! : 'reprehenderit',
    };
};

export const aCommon_PostalAddressSimple = (overrides?: Partial<Common_PostalAddressSimple>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Common_PostalAddressSimple' } & Common_PostalAddressSimple => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_PostalAddressSimple');
    return {
        __typename: 'Common_PostalAddressSimple',
        city: overrides && overrides.hasOwnProperty('city') ? overrides.city! : 'id',
        country: overrides && overrides.hasOwnProperty('country') ? overrides.country! : Common_CountryCode.Abw,
        postalCode: overrides && overrides.hasOwnProperty('postalCode') ? overrides.postalCode! : 'voluptatem',
        state: overrides && overrides.hasOwnProperty('state') ? overrides.state! : 'adipisci',
        streetAddressLine1: overrides && overrides.hasOwnProperty('streetAddressLine1') ? overrides.streetAddressLine1! : 'quod',
        streetAddressLine2: overrides && overrides.hasOwnProperty('streetAddressLine2') ? overrides.streetAddressLine2! : 'consequatur',
        streetAddressLine3: overrides && overrides.hasOwnProperty('streetAddressLine3') ? overrides.streetAddressLine3! : 'deserunt',
    };
};

export const aCommon_SuccessResponse = (overrides?: Partial<Common_SuccessResponse>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Common_SuccessResponse' } & Common_SuccessResponse => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_SuccessResponse');
    return {
        __typename: 'Common_SuccessResponse',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'ut',
    };
};

export const aCommon_Verification = (overrides?: Partial<Common_Verification>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Common_Verification' } & Common_Verification => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_Verification');
    return {
        __typename: 'Common_Verification',
        method: overrides && overrides.hasOwnProperty('method') ? overrides.method! : Common_VerificationMethod.Direct,
        status: overrides && overrides.hasOwnProperty('status') ? overrides.status! : Common_VerificationStatus.Failure,
        time: overrides && overrides.hasOwnProperty('time') ? overrides.time! : 'quis',
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : Common_VerificationType.Email,
    };
};

export const aCommon_VerificationInput = (overrides?: Partial<Common_VerificationInput>, _relationshipsToOmit: Set<string> = new Set()): Common_VerificationInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Common_VerificationInput');
    return {
        method: overrides && overrides.hasOwnProperty('method') ? overrides.method! : Common_VerificationMethod.Direct,
        status: overrides && overrides.hasOwnProperty('status') ? overrides.status! : Common_VerificationStatus.Failure,
        time: overrides && overrides.hasOwnProperty('time') ? overrides.time! : 'aut',
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : Common_VerificationType.Email,
    };
};

export const aCustomerLifeCycle_Customer = (overrides?: Partial<CustomerLifeCycle_Customer>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'CustomerLifeCycle_Customer' } & CustomerLifeCycle_Customer => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('CustomerLifeCycle_Customer');
    return {
        __typename: 'CustomerLifeCycle_Customer',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '905b27f9-1a48-44cb-a2b2-263c5f398f7b',
    };
};

export const aDataAccess_Contact = (overrides?: Partial<DataAccess_Contact>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'DataAccess_Contact' } & DataAccess_Contact => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('DataAccess_Contact');
    return {
        __typename: 'DataAccess_Contact',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '75c07587-dd8b-4bdd-8686-eb685e39ccc1',
    };
};

export const aDataAccess_Department = (overrides?: Partial<DataAccess_Department>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'DataAccess_Department' } & DataAccess_Department => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('DataAccess_Department');
    return {
        __typename: 'DataAccess_Department',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '64e2d3ef-355c-4d06-bece-1240d5e1f103',
    };
};

export const aDataAccess_Klass = (overrides?: Partial<DataAccess_Klass>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'DataAccess_Klass' } & DataAccess_Klass => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('DataAccess_Klass');
    return {
        __typename: 'DataAccess_Klass',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '82883196-a6d8-4acb-a88b-87cea38fa6e2',
    };
};

export const aDataAccess_Product = (overrides?: Partial<DataAccess_Product>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'DataAccess_Product' } & DataAccess_Product => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('DataAccess_Product');
    return {
        __typename: 'DataAccess_Product',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'bebbbadd-976c-41e4-84ae-dc5c061f0bcf',
    };
};

export const aMutation = (overrides?: Partial<Mutation>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Mutation' } & Mutation => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Mutation');
    return {
        __typename: 'Mutation',
        timeTrackingAssignGroupManagers: overrides && overrides.hasOwnProperty('timeTrackingAssignGroupManagers') ? overrides.timeTrackingAssignGroupManagers! : relationshipsToOmit.has('TimeTracking_AssignGroupManagersError') ? {} as TimeTracking_AssignGroupManagersError : aTimeTracking_AssignGroupManagersError({}, relationshipsToOmit),
        timeTrackingAssignGroupMembers: overrides && overrides.hasOwnProperty('timeTrackingAssignGroupMembers') ? overrides.timeTrackingAssignGroupMembers! : relationshipsToOmit.has('TimeTracking_AssignGroupMembersError') ? {} as TimeTracking_AssignGroupMembersError : aTimeTracking_AssignGroupMembersError({}, relationshipsToOmit),
        timeTrackingBatchManageTimeEntries: overrides && overrides.hasOwnProperty('timeTrackingBatchManageTimeEntries') ? overrides.timeTrackingBatchManageTimeEntries! : relationshipsToOmit.has('TimeTracking_BatchManageTimeEntriesError') ? {} as TimeTracking_BatchManageTimeEntriesError : aTimeTracking_BatchManageTimeEntriesError({}, relationshipsToOmit),
        timeTrackingCreateAttachments: overrides && overrides.hasOwnProperty('timeTrackingCreateAttachments') ? overrides.timeTrackingCreateAttachments! : relationshipsToOmit.has('TimeTracking_AttachmentsMutationError') ? {} as TimeTracking_AttachmentsMutationError : aTimeTracking_AttachmentsMutationError({}, relationshipsToOmit),
        timeTrackingCreateFlag: overrides && overrides.hasOwnProperty('timeTrackingCreateFlag') ? overrides.timeTrackingCreateFlag! : relationshipsToOmit.has('TimeTracking_CreateFlagPayload') ? {} as TimeTracking_CreateFlagPayload : aTimeTracking_CreateFlagPayload({}, relationshipsToOmit),
        timeTrackingCreateFlagMaps: overrides && overrides.hasOwnProperty('timeTrackingCreateFlagMaps') ? overrides.timeTrackingCreateFlagMaps! : relationshipsToOmit.has('TimeTracking_CreateFlagMapsPayload') ? {} as TimeTracking_CreateFlagMapsPayload : aTimeTracking_CreateFlagMapsPayload({}, relationshipsToOmit),
        timeTrackingCreateGroup: overrides && overrides.hasOwnProperty('timeTrackingCreateGroup') ? overrides.timeTrackingCreateGroup! : relationshipsToOmit.has('TimeTracking_CreateGroupError') ? {} as TimeTracking_CreateGroupError : aTimeTracking_CreateGroupError({}, relationshipsToOmit),
        timeTrackingCreateLocationPoints: overrides && overrides.hasOwnProperty('timeTrackingCreateLocationPoints') ? overrides.timeTrackingCreateLocationPoints! : relationshipsToOmit.has('TimeTracking_CreateLocationPointsError') ? {} as TimeTracking_CreateLocationPointsError : aTimeTracking_CreateLocationPointsError({}, relationshipsToOmit),
        timeTrackingCreateProjectEstimate: overrides && overrides.hasOwnProperty('timeTrackingCreateProjectEstimate') ? overrides.timeTrackingCreateProjectEstimate! : relationshipsToOmit.has('TimeTracking_CreateProjectEstimateError') ? {} as TimeTracking_CreateProjectEstimateError : aTimeTracking_CreateProjectEstimateError({}, relationshipsToOmit),
        timeTrackingCreateTimeEntry: overrides && overrides.hasOwnProperty('timeTrackingCreateTimeEntry') ? overrides.timeTrackingCreateTimeEntry! : relationshipsToOmit.has('TimeTracking_CreateTimeEntryError') ? {} as TimeTracking_CreateTimeEntryError : aTimeTracking_CreateTimeEntryError({}, relationshipsToOmit),
        timeTrackingDeleteAttachments: overrides && overrides.hasOwnProperty('timeTrackingDeleteAttachments') ? overrides.timeTrackingDeleteAttachments! : relationshipsToOmit.has('TimeTracking_AttachmentsMutationError') ? {} as TimeTracking_AttachmentsMutationError : aTimeTracking_AttachmentsMutationError({}, relationshipsToOmit),
        timeTrackingDeleteGroup: overrides && overrides.hasOwnProperty('timeTrackingDeleteGroup') ? overrides.timeTrackingDeleteGroup! : relationshipsToOmit.has('TimeTracking_DeleteGroupError') ? {} as TimeTracking_DeleteGroupError : aTimeTracking_DeleteGroupError({}, relationshipsToOmit),
        timeTrackingDeletePost: overrides && overrides.hasOwnProperty('timeTrackingDeletePost') ? overrides.timeTrackingDeletePost! : relationshipsToOmit.has('TimeTracking_DeletePostError') ? {} as TimeTracking_DeletePostError : aTimeTracking_DeletePostError({}, relationshipsToOmit),
        timeTrackingDeleteProjectEstimate: overrides && overrides.hasOwnProperty('timeTrackingDeleteProjectEstimate') ? overrides.timeTrackingDeleteProjectEstimate! : relationshipsToOmit.has('TimeTracking_DeleteProjectEstimateError') ? {} as TimeTracking_DeleteProjectEstimateError : aTimeTracking_DeleteProjectEstimateError({}, relationshipsToOmit),
        timeTrackingDeleteTimeEntry: overrides && overrides.hasOwnProperty('timeTrackingDeleteTimeEntry') ? overrides.timeTrackingDeleteTimeEntry! : relationshipsToOmit.has('TimeTracking_DeleteTimeEntryError') ? {} as TimeTracking_DeleteTimeEntryError : aTimeTracking_DeleteTimeEntryError({}, relationshipsToOmit),
        timeTrackingManageCustomFieldAssignment: overrides && overrides.hasOwnProperty('timeTrackingManageCustomFieldAssignment') ? overrides.timeTrackingManageCustomFieldAssignment! : relationshipsToOmit.has('TimeTracking_ManageCustomFieldAssignmentError') ? {} as TimeTracking_ManageCustomFieldAssignmentError : aTimeTracking_ManageCustomFieldAssignmentError({}, relationshipsToOmit),
        timeTrackingManageCustomFieldOptionAssignment: overrides && overrides.hasOwnProperty('timeTrackingManageCustomFieldOptionAssignment') ? overrides.timeTrackingManageCustomFieldOptionAssignment! : relationshipsToOmit.has('TimeTracking_ManageCustomFieldOptionAssignmentError') ? {} as TimeTracking_ManageCustomFieldOptionAssignmentError : aTimeTracking_ManageCustomFieldOptionAssignmentError({}, relationshipsToOmit),
        timeTrackingManageCustomFieldOptionTimeAgainstAssignment: overrides && overrides.hasOwnProperty('timeTrackingManageCustomFieldOptionTimeAgainstAssignment') ? overrides.timeTrackingManageCustomFieldOptionTimeAgainstAssignment! : relationshipsToOmit.has('TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError') ? {} as TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError : aTimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError({}, relationshipsToOmit),
        timeTrackingManageCustomFields: overrides && overrides.hasOwnProperty('timeTrackingManageCustomFields') ? overrides.timeTrackingManageCustomFields! : relationshipsToOmit.has('TimeTracking_ManageCustomFieldsError') ? {} as TimeTracking_ManageCustomFieldsError : aTimeTracking_ManageCustomFieldsError({}, relationshipsToOmit),
        timeTrackingManagePost: overrides && overrides.hasOwnProperty('timeTrackingManagePost') ? overrides.timeTrackingManagePost! : relationshipsToOmit.has('TimeTracking_ManagePostError') ? {} as TimeTracking_ManagePostError : aTimeTracking_ManagePostError({}, relationshipsToOmit),
        timeTrackingManageStandardFieldAssignment: overrides && overrides.hasOwnProperty('timeTrackingManageStandardFieldAssignment') ? overrides.timeTrackingManageStandardFieldAssignment! : relationshipsToOmit.has('TimeTracking_ManageStandardFieldAssignmentError') ? {} as TimeTracking_ManageStandardFieldAssignmentError : aTimeTracking_ManageStandardFieldAssignmentError({}, relationshipsToOmit),
        timeTrackingManageStandardFieldOptionTimeAgainstAssignment: overrides && overrides.hasOwnProperty('timeTrackingManageStandardFieldOptionTimeAgainstAssignment') ? overrides.timeTrackingManageStandardFieldOptionTimeAgainstAssignment! : relationshipsToOmit.has('TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError') ? {} as TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError : aTimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError({}, relationshipsToOmit),
        timeTrackingManageStandardFieldOptionTimeForAssignment: overrides && overrides.hasOwnProperty('timeTrackingManageStandardFieldOptionTimeForAssignment') ? overrides.timeTrackingManageStandardFieldOptionTimeForAssignment! : relationshipsToOmit.has('TimeTracking_ManageStandardFieldOptionTimeForAssignmentError') ? {} as TimeTracking_ManageStandardFieldOptionTimeForAssignmentError : aTimeTracking_ManageStandardFieldOptionTimeForAssignmentError({}, relationshipsToOmit),
        timeTrackingManageTimeAgainstFieldAssignment: overrides && overrides.hasOwnProperty('timeTrackingManageTimeAgainstFieldAssignment') ? overrides.timeTrackingManageTimeAgainstFieldAssignment! : relationshipsToOmit.has('TimeTracking_ManageTimeAgainstFieldAssignmentError') ? {} as TimeTracking_ManageTimeAgainstFieldAssignmentError : aTimeTracking_ManageTimeAgainstFieldAssignmentError({}, relationshipsToOmit),
        timeTrackingManageTimeAgainstTimeForAssignment: overrides && overrides.hasOwnProperty('timeTrackingManageTimeAgainstTimeForAssignment') ? overrides.timeTrackingManageTimeAgainstTimeForAssignment! : relationshipsToOmit.has('TimeTracking_ManageTimeAgainstTimeForAssignmentError') ? {} as TimeTracking_ManageTimeAgainstTimeForAssignmentError : aTimeTracking_ManageTimeAgainstTimeForAssignmentError({}, relationshipsToOmit),
        timeTrackingManageUnifiedUserSettings: overrides && overrides.hasOwnProperty('timeTrackingManageUnifiedUserSettings') ? overrides.timeTrackingManageUnifiedUserSettings! : relationshipsToOmit.has('TimeTracking_ManageUnifiedUserSettingsError') ? {} as TimeTracking_ManageUnifiedUserSettingsError : aTimeTracking_ManageUnifiedUserSettingsError({}, relationshipsToOmit),
        timeTrackingManageUserSettings: overrides && overrides.hasOwnProperty('timeTrackingManageUserSettings') ? overrides.timeTrackingManageUserSettings! : relationshipsToOmit.has('TimeTracking_ManageUserSettingsError') ? {} as TimeTracking_ManageUserSettingsError : aTimeTracking_ManageUserSettingsError({}, relationshipsToOmit),
        timeTrackingMarkPostsRead: overrides && overrides.hasOwnProperty('timeTrackingMarkPostsRead') ? overrides.timeTrackingMarkPostsRead! : relationshipsToOmit.has('TimeTracking_MarkPostsReadError') ? {} as TimeTracking_MarkPostsReadError : aTimeTracking_MarkPostsReadError({}, relationshipsToOmit),
        timeTrackingRemoveGroupManagers: overrides && overrides.hasOwnProperty('timeTrackingRemoveGroupManagers') ? overrides.timeTrackingRemoveGroupManagers! : relationshipsToOmit.has('TimeTracking_RemoveGroupManagersError') ? {} as TimeTracking_RemoveGroupManagersError : aTimeTracking_RemoveGroupManagersError({}, relationshipsToOmit),
        timeTrackingRemoveGroupMembers: overrides && overrides.hasOwnProperty('timeTrackingRemoveGroupMembers') ? overrides.timeTrackingRemoveGroupMembers! : relationshipsToOmit.has('TimeTracking_RemoveGroupMembersError') ? {} as TimeTracking_RemoveGroupMembersError : aTimeTracking_RemoveGroupMembersError({}, relationshipsToOmit),
        timeTrackingResetUserSettings: overrides && overrides.hasOwnProperty('timeTrackingResetUserSettings') ? overrides.timeTrackingResetUserSettings! : relationshipsToOmit.has('TimeTracking_ResetUserSettingsError') ? {} as TimeTracking_ResetUserSettingsError : aTimeTracking_ResetUserSettingsError({}, relationshipsToOmit),
        timeTrackingSubmitWorkerTime: overrides && overrides.hasOwnProperty('timeTrackingSubmitWorkerTime') ? overrides.timeTrackingSubmitWorkerTime! : relationshipsToOmit.has('TimeTracking_SubmitWorkerTimeError') ? {} as TimeTracking_SubmitWorkerTimeError : aTimeTracking_SubmitWorkerTimeError({}, relationshipsToOmit),
        timeTrackingUpdateApprovalSettings: overrides && overrides.hasOwnProperty('timeTrackingUpdateApprovalSettings') ? overrides.timeTrackingUpdateApprovalSettings! : relationshipsToOmit.has('TimeTracking_UpdateApprovalSettingsError') ? {} as TimeTracking_UpdateApprovalSettingsError : aTimeTracking_UpdateApprovalSettingsError({}, relationshipsToOmit),
        timeTrackingUpdateAttachments: overrides && overrides.hasOwnProperty('timeTrackingUpdateAttachments') ? overrides.timeTrackingUpdateAttachments! : relationshipsToOmit.has('TimeTracking_AttachmentsMutationError') ? {} as TimeTracking_AttachmentsMutationError : aTimeTracking_AttachmentsMutationError({}, relationshipsToOmit),
        timeTrackingUpdateEmployerSettings: overrides && overrides.hasOwnProperty('timeTrackingUpdateEmployerSettings') ? overrides.timeTrackingUpdateEmployerSettings! : relationshipsToOmit.has('TimeTracking_UpdateEmployerSettingsError') ? {} as TimeTracking_UpdateEmployerSettingsError : aTimeTracking_UpdateEmployerSettingsError({}, relationshipsToOmit),
        timeTrackingUpdateGeofenceConfiguration: overrides && overrides.hasOwnProperty('timeTrackingUpdateGeofenceConfiguration') ? overrides.timeTrackingUpdateGeofenceConfiguration! : relationshipsToOmit.has('TimeTracking_UpdateGeofenceConfigurationError') ? {} as TimeTracking_UpdateGeofenceConfigurationError : aTimeTracking_UpdateGeofenceConfigurationError({}, relationshipsToOmit),
        timeTrackingUpdateGroup: overrides && overrides.hasOwnProperty('timeTrackingUpdateGroup') ? overrides.timeTrackingUpdateGroup! : relationshipsToOmit.has('TimeTracking_UpdateGroupError') ? {} as TimeTracking_UpdateGroupError : aTimeTracking_UpdateGroupError({}, relationshipsToOmit),
        timeTrackingUpdateProjectEstimate: overrides && overrides.hasOwnProperty('timeTrackingUpdateProjectEstimate') ? overrides.timeTrackingUpdateProjectEstimate! : relationshipsToOmit.has('TimeTracking_UpdateProjectEstimateError') ? {} as TimeTracking_UpdateProjectEstimateError : aTimeTracking_UpdateProjectEstimateError({}, relationshipsToOmit),
        timeTrackingUpdateTimeEntry: overrides && overrides.hasOwnProperty('timeTrackingUpdateTimeEntry') ? overrides.timeTrackingUpdateTimeEntry! : relationshipsToOmit.has('TimeTracking_UpdateTimeEntryError') ? {} as TimeTracking_UpdateTimeEntryError : aTimeTracking_UpdateTimeEntryError({}, relationshipsToOmit),
        timeTrackingUpdateWorkerPermissions: overrides && overrides.hasOwnProperty('timeTrackingUpdateWorkerPermissions') ? overrides.timeTrackingUpdateWorkerPermissions! : relationshipsToOmit.has('TimeTracking_UpdateWorkerPermissionsError') ? {} as TimeTracking_UpdateWorkerPermissionsError : aTimeTracking_UpdateWorkerPermissionsError({}, relationshipsToOmit),
    };
};

export const aPayroll_EmployeeCompensation = (overrides?: Partial<Payroll_EmployeeCompensation>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Payroll_EmployeeCompensation' } & Payroll_EmployeeCompensation => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Payroll_EmployeeCompensation');
    return {
        __typename: 'Payroll_EmployeeCompensation',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '23af7eec-4b4b-4fe0-a9a3-b42808311514',
    };
};

export const aPayroll_EmployerBreak = (overrides?: Partial<Payroll_EmployerBreak>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Payroll_EmployerBreak' } & Payroll_EmployerBreak => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Payroll_EmployerBreak');
    return {
        __typename: 'Payroll_EmployerBreak',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '4fc335fc-8362-41ce-b2b0-11c41c30c2b2',
    };
};

export const aProjectManagement_Project = (overrides?: Partial<ProjectManagement_Project>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'ProjectManagement_Project' } & ProjectManagement_Project => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('ProjectManagement_Project');
    return {
        __typename: 'ProjectManagement_Project',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'ab7d9691-060d-4d06-ba94-b8984f9d433a',
    };
};

export const aQb_AlternateId = (overrides?: Partial<Qb_AlternateId>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Qb_AlternateId' } & Qb_AlternateId => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Qb_AlternateId');
    return {
        __typename: 'Qb_AlternateId',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'eligendi',
        nameSpace: overrides && overrides.hasOwnProperty('nameSpace') ? overrides.nameSpace! : 'id',
    };
};

export const aQuery = (overrides?: Partial<Query>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'Query' } & Query => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('Query');
    return {
        __typename: 'Query',
        timeTrackingApprovalSettings: overrides && overrides.hasOwnProperty('timeTrackingApprovalSettings') ? overrides.timeTrackingApprovalSettings! : relationshipsToOmit.has('TimeTracking_ApprovalSettings') ? {} as TimeTracking_ApprovalSettings : aTimeTracking_ApprovalSettings({}, relationshipsToOmit),
        timeTrackingAttachments: overrides && overrides.hasOwnProperty('timeTrackingAttachments') ? overrides.timeTrackingAttachments! : relationshipsToOmit.has('TimeTracking_AttachmentInfoConnection') ? {} as TimeTracking_AttachmentInfoConnection : aTimeTracking_AttachmentInfoConnection({}, relationshipsToOmit),
        timeTrackingCustomDimensions: overrides && overrides.hasOwnProperty('timeTrackingCustomDimensions') ? overrides.timeTrackingCustomDimensions! : relationshipsToOmit.has('TimeTracking_CustomDimensionsConnection') ? {} as TimeTracking_CustomDimensionsConnection : aTimeTracking_CustomDimensionsConnection({}, relationshipsToOmit),
        timeTrackingCustomFieldAssignments: overrides && overrides.hasOwnProperty('timeTrackingCustomFieldAssignments') ? overrides.timeTrackingCustomFieldAssignments! : relationshipsToOmit.has('TimeTracking_CustomFieldAssignmentsConnection') ? {} as TimeTracking_CustomFieldAssignmentsConnection : aTimeTracking_CustomFieldAssignmentsConnection({}, relationshipsToOmit),
        timeTrackingCustomFieldOptionAssignments: overrides && overrides.hasOwnProperty('timeTrackingCustomFieldOptionAssignments') ? overrides.timeTrackingCustomFieldOptionAssignments! : relationshipsToOmit.has('TimeTracking_CustomFieldOptionAssignmentConnection') ? {} as TimeTracking_CustomFieldOptionAssignmentConnection : aTimeTracking_CustomFieldOptionAssignmentConnection({}, relationshipsToOmit),
        timeTrackingCustomFields: overrides && overrides.hasOwnProperty('timeTrackingCustomFields') ? overrides.timeTrackingCustomFields! : relationshipsToOmit.has('TimeTracking_CustomFieldDefinitionConnection') ? {} as TimeTracking_CustomFieldDefinitionConnection : aTimeTracking_CustomFieldDefinitionConnection({}, relationshipsToOmit),
        timeTrackingCustomerTimeSummary: overrides && overrides.hasOwnProperty('timeTrackingCustomerTimeSummary') ? overrides.timeTrackingCustomerTimeSummary! : relationshipsToOmit.has('TimeTracking_CustomerTimeSummaryConnection') ? {} as TimeTracking_CustomerTimeSummaryConnection : aTimeTracking_CustomerTimeSummaryConnection({}, relationshipsToOmit),
        timeTrackingEffectiveUserSettings: overrides && overrides.hasOwnProperty('timeTrackingEffectiveUserSettings') ? overrides.timeTrackingEffectiveUserSettings! : relationshipsToOmit.has('TimeTracking_EffectiveUserSettings') ? {} as TimeTracking_EffectiveUserSettings : aTimeTracking_EffectiveUserSettings({}, relationshipsToOmit),
        timeTrackingEmployerSettings: overrides && overrides.hasOwnProperty('timeTrackingEmployerSettings') ? overrides.timeTrackingEmployerSettings! : relationshipsToOmit.has('TimeTracking_EmployerSettings') ? {} as TimeTracking_EmployerSettings : aTimeTracking_EmployerSettings({}, relationshipsToOmit),
        timeTrackingGeofenceConfiguration: overrides && overrides.hasOwnProperty('timeTrackingGeofenceConfiguration') ? overrides.timeTrackingGeofenceConfiguration! : relationshipsToOmit.has('TimeTracking_GeofenceConfigurationConnection') ? {} as TimeTracking_GeofenceConfigurationConnection : aTimeTracking_GeofenceConfigurationConnection({}, relationshipsToOmit),
        timeTrackingGeofenceRadius: overrides && overrides.hasOwnProperty('timeTrackingGeofenceRadius') ? overrides.timeTrackingGeofenceRadius! : relationshipsToOmit.has('TimeTracking_GeofenceRadiusResult') ? {} as TimeTracking_GeofenceRadiusResult : aTimeTracking_GeofenceRadiusResult({}, relationshipsToOmit),
        timeTrackingGroups: overrides && overrides.hasOwnProperty('timeTrackingGroups') ? overrides.timeTrackingGroups! : relationshipsToOmit.has('TimeTracking_GroupConnection') ? {} as TimeTracking_GroupConnection : aTimeTracking_GroupConnection({}, relationshipsToOmit),
        timeTrackingLocationDetail: overrides && overrides.hasOwnProperty('timeTrackingLocationDetail') ? overrides.timeTrackingLocationDetail! : relationshipsToOmit.has('TimeTracking_LocationDetail') ? {} as TimeTracking_LocationDetail : aTimeTracking_LocationDetail({}, relationshipsToOmit),
        timeTrackingNearbyCustomers: overrides && overrides.hasOwnProperty('timeTrackingNearbyCustomers') ? overrides.timeTrackingNearbyCustomers! : relationshipsToOmit.has('TimeTracking_NearbyCustomersConnection') ? {} as TimeTracking_NearbyCustomersConnection : aTimeTracking_NearbyCustomersConnection({}, relationshipsToOmit),
        timeTrackingPayrollEmployeeData: overrides && overrides.hasOwnProperty('timeTrackingPayrollEmployeeData') ? overrides.timeTrackingPayrollEmployeeData! : relationshipsToOmit.has('TimeTracking_PayrollEmployeeDataConnection') ? {} as TimeTracking_PayrollEmployeeDataConnection : aTimeTracking_PayrollEmployeeDataConnection({}, relationshipsToOmit),
        timeTrackingPosts: overrides && overrides.hasOwnProperty('timeTrackingPosts') ? overrides.timeTrackingPosts! : relationshipsToOmit.has('TimeTracking_PostsConnection') ? {} as TimeTracking_PostsConnection : aTimeTracking_PostsConnection({}, relationshipsToOmit),
        timeTrackingPostsUnreadCount: overrides && overrides.hasOwnProperty('timeTrackingPostsUnreadCount') ? overrides.timeTrackingPostsUnreadCount! : relationshipsToOmit.has('TimeTracking_PostsUnreadCountResult') ? {} as TimeTracking_PostsUnreadCountResult : aTimeTracking_PostsUnreadCountResult({}, relationshipsToOmit),
        timeTrackingProjectEstimates: overrides && overrides.hasOwnProperty('timeTrackingProjectEstimates') ? overrides.timeTrackingProjectEstimates! : relationshipsToOmit.has('TimeTracking_ProjectEstimatesConnection') ? {} as TimeTracking_ProjectEstimatesConnection : aTimeTracking_ProjectEstimatesConnection({}, relationshipsToOmit),
        timeTrackingStandardFieldAssignmentSummary: overrides && overrides.hasOwnProperty('timeTrackingStandardFieldAssignmentSummary') ? overrides.timeTrackingStandardFieldAssignmentSummary! : relationshipsToOmit.has('TimeTracking_StandardFieldAssignmentSummaryConnection') ? {} as TimeTracking_StandardFieldAssignmentSummaryConnection : aTimeTracking_StandardFieldAssignmentSummaryConnection({}, relationshipsToOmit),
        timeTrackingStandardFieldAssignments: overrides && overrides.hasOwnProperty('timeTrackingStandardFieldAssignments') ? overrides.timeTrackingStandardFieldAssignments! : relationshipsToOmit.has('TimeTracking_StandardFieldAssignmentsConnection') ? {} as TimeTracking_StandardFieldAssignmentsConnection : aTimeTracking_StandardFieldAssignmentsConnection({}, relationshipsToOmit),
        timeTrackingStandardFieldOptionAssignments: overrides && overrides.hasOwnProperty('timeTrackingStandardFieldOptionAssignments') ? overrides.timeTrackingStandardFieldOptionAssignments! : relationshipsToOmit.has('TimeTracking_StandardFieldOptionAssignmentConnection') ? {} as TimeTracking_StandardFieldOptionAssignmentConnection : aTimeTracking_StandardFieldOptionAssignmentConnection({}, relationshipsToOmit),
        timeTrackingStandardFieldOptionSummary: overrides && overrides.hasOwnProperty('timeTrackingStandardFieldOptionSummary') ? overrides.timeTrackingStandardFieldOptionSummary! : relationshipsToOmit.has('TimeTracking_StandardFieldOptionSummaryConnection') ? {} as TimeTracking_StandardFieldOptionSummaryConnection : aTimeTracking_StandardFieldOptionSummaryConnection({}, relationshipsToOmit),
        timeTrackingTimeAgainst: overrides && overrides.hasOwnProperty('timeTrackingTimeAgainst') ? overrides.timeTrackingTimeAgainst! : relationshipsToOmit.has('TimeTracking_TimeAgainstConnection') ? {} as TimeTracking_TimeAgainstConnection : aTimeTracking_TimeAgainstConnection({}, relationshipsToOmit),
        timeTrackingTimeAgainstAssignmentSummary: overrides && overrides.hasOwnProperty('timeTrackingTimeAgainstAssignmentSummary') ? overrides.timeTrackingTimeAgainstAssignmentSummary! : relationshipsToOmit.has('TimeTracking_TimeAgainstAssignmentSummaryConnection') ? {} as TimeTracking_TimeAgainstAssignmentSummaryConnection : aTimeTracking_TimeAgainstAssignmentSummaryConnection({}, relationshipsToOmit),
        timeTrackingTimeAgainstAssignments: overrides && overrides.hasOwnProperty('timeTrackingTimeAgainstAssignments') ? overrides.timeTrackingTimeAgainstAssignments! : relationshipsToOmit.has('TimeTracking_TimeAgainstAssignmentConnection') ? {} as TimeTracking_TimeAgainstAssignmentConnection : aTimeTracking_TimeAgainstAssignmentConnection({}, relationshipsToOmit),
        timeTrackingTimeCostSummary: overrides && overrides.hasOwnProperty('timeTrackingTimeCostSummary') ? overrides.timeTrackingTimeCostSummary! : relationshipsToOmit.has('TimeTracking_TimeCostSummaryConnection') ? {} as TimeTracking_TimeCostSummaryConnection : aTimeTracking_TimeCostSummaryConnection({}, relationshipsToOmit),
        timeTrackingTimeEntries: overrides && overrides.hasOwnProperty('timeTrackingTimeEntries') ? overrides.timeTrackingTimeEntries! : relationshipsToOmit.has('TimeTracking_TimeEntriesConnection') ? {} as TimeTracking_TimeEntriesConnection : aTimeTracking_TimeEntriesConnection({}, relationshipsToOmit),
        timeTrackingTimeEntry: overrides && overrides.hasOwnProperty('timeTrackingTimeEntry') ? overrides.timeTrackingTimeEntry! : relationshipsToOmit.has('TimeTracking_TimeEntry') ? {} as TimeTracking_TimeEntry : aTimeTracking_TimeEntry({}, relationshipsToOmit),
        timeTrackingTimeForAssignments: overrides && overrides.hasOwnProperty('timeTrackingTimeForAssignments') ? overrides.timeTrackingTimeForAssignments! : relationshipsToOmit.has('TimeTracking_TimeForAssignmentsConnection') ? {} as TimeTracking_TimeForAssignmentsConnection : aTimeTracking_TimeForAssignmentsConnection({}, relationshipsToOmit),
        timeTrackingTotalDurationByDate: overrides && overrides.hasOwnProperty('timeTrackingTotalDurationByDate') ? overrides.timeTrackingTotalDurationByDate! : relationshipsToOmit.has('TimeTracking_TotalDurationByDateConnection') ? {} as TimeTracking_TotalDurationByDateConnection : aTimeTracking_TotalDurationByDateConnection({}, relationshipsToOmit),
        timeTrackingTotalDurationByTimeWindow: overrides && overrides.hasOwnProperty('timeTrackingTotalDurationByTimeWindow') ? overrides.timeTrackingTotalDurationByTimeWindow! : relationshipsToOmit.has('TimeTracking_TotalDurationByTimeWindow') ? {} as TimeTracking_TotalDurationByTimeWindow : aTimeTracking_TotalDurationByTimeWindow({}, relationshipsToOmit),
        timeTrackingUnifiedUserSettings: overrides && overrides.hasOwnProperty('timeTrackingUnifiedUserSettings') ? overrides.timeTrackingUnifiedUserSettings! : relationshipsToOmit.has('TimeTracking_UnifiedUserSettings') ? {} as TimeTracking_UnifiedUserSettings : aTimeTracking_UnifiedUserSettings({}, relationshipsToOmit),
        timeTrackingUserSettings: overrides && overrides.hasOwnProperty('timeTrackingUserSettings') ? overrides.timeTrackingUserSettings! : relationshipsToOmit.has('TimeTracking_UserSettings') ? {} as TimeTracking_UserSettings : aTimeTracking_UserSettings({}, relationshipsToOmit),
        timeTrackingWhoIsWorking: overrides && overrides.hasOwnProperty('timeTrackingWhoIsWorking') ? overrides.timeTrackingWhoIsWorking! : relationshipsToOmit.has('TimeTracking_WhoIsWorkingConnection') ? {} as TimeTracking_WhoIsWorkingConnection : aTimeTracking_WhoIsWorkingConnection({}, relationshipsToOmit),
        timeTrackingWorkerPermissions: overrides && overrides.hasOwnProperty('timeTrackingWorkerPermissions') ? overrides.timeTrackingWorkerPermissions! : relationshipsToOmit.has('TimeTracking_WorkerPermissions') ? {} as TimeTracking_WorkerPermissions : aTimeTracking_WorkerPermissions({}, relationshipsToOmit),
        timeTrackingWorkerSubmitTimeDates: overrides && overrides.hasOwnProperty('timeTrackingWorkerSubmitTimeDates') ? overrides.timeTrackingWorkerSubmitTimeDates! : relationshipsToOmit.has('TimeTracking_WorkerSubmitTimeDates') ? {} as TimeTracking_WorkerSubmitTimeDates : aTimeTracking_WorkerSubmitTimeDates({}, relationshipsToOmit),
        timeTrackingWorkerTimeSummary: overrides && overrides.hasOwnProperty('timeTrackingWorkerTimeSummary') ? overrides.timeTrackingWorkerTimeSummary! : relationshipsToOmit.has('TimeTracking_WorkerTimeSummaryConnection') ? {} as TimeTracking_WorkerTimeSummaryConnection : aTimeTracking_WorkerTimeSummaryConnection({}, relationshipsToOmit),
        timeTrackingWorkers: overrides && overrides.hasOwnProperty('timeTrackingWorkers') ? overrides.timeTrackingWorkers! : relationshipsToOmit.has('TimeTracking_WorkerConnection') ? {} as TimeTracking_WorkerConnection : aTimeTracking_WorkerConnection({}, relationshipsToOmit),
        timeTrackingWorkersWithTimeEntries: overrides && overrides.hasOwnProperty('timeTrackingWorkersWithTimeEntries') ? overrides.timeTrackingWorkersWithTimeEntries! : relationshipsToOmit.has('TimeTracking_WorkersWithTimeEntriesConnection') ? {} as TimeTracking_WorkersWithTimeEntriesConnection : aTimeTracking_WorkersWithTimeEntriesConnection({}, relationshipsToOmit),
    };
};

export const aTimeTrackingUpdateSetting_IntegerInput = (overrides?: Partial<TimeTrackingUpdateSetting_IntegerInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTrackingUpdateSetting_IntegerInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTrackingUpdateSetting_IntegerInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : 3335,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'numquam',
    };
};

export const aTimeTrackingUpdateSetting_StringInput = (overrides?: Partial<TimeTrackingUpdateSetting_StringInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTrackingUpdateSetting_StringInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTrackingUpdateSetting_StringInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : 'excepturi',
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'cupiditate',
    };
};

export const aTimeTracking_AlternateIdsFilter = (overrides?: Partial<TimeTracking_AlternateIdsFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_AlternateIdsFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AlternateIdsFilter');
    return {
        nameSpace: overrides && overrides.hasOwnProperty('nameSpace') ? overrides.nameSpace! : 'velit',
    };
};

export const aTimeTracking_ApprovalBaseReminderSettings = (overrides?: Partial<TimeTracking_ApprovalBaseReminderSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ApprovalBaseReminderSettings' } & TimeTracking_ApprovalBaseReminderSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ApprovalBaseReminderSettings');
    return {
        __typename: 'TimeTracking_ApprovalBaseReminderSettings',
        hour: overrides && overrides.hasOwnProperty('hour') ? overrides.hour! : relationshipsToOmit.has('TimeTracking_SettingInteger') ? {} as TimeTracking_SettingInteger : aTimeTracking_SettingInteger({}, relationshipsToOmit),
        reminderMedium: overrides && overrides.hasOwnProperty('reminderMedium') ? overrides.reminderMedium! : relationshipsToOmit.has('TimeTracking_SettingNotificationMedium') ? {} as TimeTracking_SettingNotificationMedium : aTimeTracking_SettingNotificationMedium({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ApprovalReminder = (overrides?: Partial<TimeTracking_ApprovalReminder>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ApprovalReminder' } & TimeTracking_ApprovalReminder => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ApprovalReminder');
    return {
        __typename: 'TimeTracking_ApprovalReminder',
        payPeriod: overrides && overrides.hasOwnProperty('payPeriod') ? overrides.payPeriod! : relationshipsToOmit.has('TimeTracking_PayPeriodApprovalReminder') ? {} as TimeTracking_PayPeriodApprovalReminder : aTimeTracking_PayPeriodApprovalReminder({}, relationshipsToOmit),
        week: overrides && overrides.hasOwnProperty('week') ? overrides.week! : relationshipsToOmit.has('TimeTracking_WeeklyApprovalReminder') ? {} as TimeTracking_WeeklyApprovalReminder : aTimeTracking_WeeklyApprovalReminder({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ApprovalReminderBasisSetting = (overrides?: Partial<TimeTracking_ApprovalReminderBasisSetting>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ApprovalReminderBasisSetting' } & TimeTracking_ApprovalReminderBasisSetting => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ApprovalReminderBasisSetting');
    return {
        __typename: 'TimeTracking_ApprovalReminderBasisSetting',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : TimeTracking_ApprovalReminderBasis.Daily,
    };
};

export const aTimeTracking_ApprovalReminderDaysOfWeek = (overrides?: Partial<TimeTracking_ApprovalReminderDaysOfWeek>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ApprovalReminderDaysOfWeek' } & TimeTracking_ApprovalReminderDaysOfWeek => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ApprovalReminderDaysOfWeek');
    return {
        __typename: 'TimeTracking_ApprovalReminderDaysOfWeek',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : [Common_DayOfWeek.Friday],
    };
};

export const aTimeTracking_ApprovalReminderDaysOfWeekInput = (overrides?: Partial<TimeTracking_ApprovalReminderDaysOfWeekInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ApprovalReminderDaysOfWeekInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ApprovalReminderDaysOfWeekInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : [Common_DayOfWeek.Friday],
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'autem',
    };
};

export const aTimeTracking_ApprovalSettings = (overrides?: Partial<TimeTracking_ApprovalSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ApprovalSettings' } & TimeTracking_ApprovalSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ApprovalSettings');
    return {
        __typename: 'TimeTracking_ApprovalSettings',
        employee: overrides && overrides.hasOwnProperty('employee') ? overrides.employee! : relationshipsToOmit.has('TimeTracking_EmployeeApprovalSettings') ? {} as TimeTracking_EmployeeApprovalSettings : aTimeTracking_EmployeeApprovalSettings({}, relationshipsToOmit),
        manager: overrides && overrides.hasOwnProperty('manager') ? overrides.manager! : relationshipsToOmit.has('TimeTracking_ManagerApprovalSettings') ? {} as TimeTracking_ManagerApprovalSettings : aTimeTracking_ManagerApprovalSettings({}, relationshipsToOmit),
        submissionNotifications: overrides && overrides.hasOwnProperty('submissionNotifications') ? overrides.submissionNotifications! : relationshipsToOmit.has('TimeTracking_ApprovalSubmissionNotificationSettings') ? {} as TimeTracking_ApprovalSubmissionNotificationSettings : aTimeTracking_ApprovalSubmissionNotificationSettings({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ApprovalSubmissionNotificationSettings = (overrides?: Partial<TimeTracking_ApprovalSubmissionNotificationSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ApprovalSubmissionNotificationSettings' } & TimeTracking_ApprovalSubmissionNotificationSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ApprovalSubmissionNotificationSettings');
    return {
        __typename: 'TimeTracking_ApprovalSubmissionNotificationSettings',
        notifyManagerOnGroupSubmitted: overrides && overrides.hasOwnProperty('notifyManagerOnGroupSubmitted') ? overrides.notifyManagerOnGroupSubmitted! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        notifyManagerOnSubmit: overrides && overrides.hasOwnProperty('notifyManagerOnSubmit') ? overrides.notifyManagerOnSubmit! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ApprovalSubmissionNotificationSettingsInput = (overrides?: Partial<TimeTracking_ApprovalSubmissionNotificationSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ApprovalSubmissionNotificationSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ApprovalSubmissionNotificationSettingsInput');
    return {
        notifyManagerOnGroupSubmitted: overrides && overrides.hasOwnProperty('notifyManagerOnGroupSubmitted') ? overrides.notifyManagerOnGroupSubmitted! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        notifyManagerOnSubmit: overrides && overrides.hasOwnProperty('notifyManagerOnSubmit') ? overrides.notifyManagerOnSubmit! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_AssignGroupManagersError = (overrides?: Partial<TimeTracking_AssignGroupManagersError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_AssignGroupManagersError' } & TimeTracking_AssignGroupManagersError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AssignGroupManagersError');
    return {
        __typename: 'TimeTracking_AssignGroupManagersError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'maiores',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'iste',
        groupId: overrides && overrides.hasOwnProperty('groupId') ? overrides.groupId! : 'quaerat',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'veniam',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'reiciendis',
    };
};

export const aTimeTracking_AssignGroupManagersInput = (overrides?: Partial<TimeTracking_AssignGroupManagersInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_AssignGroupManagersInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AssignGroupManagersInput');
    return {
        groupId: overrides && overrides.hasOwnProperty('groupId') ? overrides.groupId! : '1203ee3c-8524-4f12-8ec3-6641593af9d3',
        managers: overrides && overrides.hasOwnProperty('managers') ? overrides.managers! : [relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_AssignGroupManagersPayload = (overrides?: Partial<TimeTracking_AssignGroupManagersPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_AssignGroupManagersPayload' } & TimeTracking_AssignGroupManagersPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AssignGroupManagersPayload');
    return {
        __typename: 'TimeTracking_AssignGroupManagersPayload',
        assignmentResults: overrides && overrides.hasOwnProperty('assignmentResults') ? overrides.assignmentResults! : [relationshipsToOmit.has('TimeTracking_GroupManagerAssignmentError') ? {} as TimeTracking_GroupManagerAssignmentError : aTimeTracking_GroupManagerAssignmentError({}, relationshipsToOmit)],
        group: overrides && overrides.hasOwnProperty('group') ? overrides.group! : relationshipsToOmit.has('TimeTracking_Group') ? {} as TimeTracking_Group : aTimeTracking_Group({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'voluptatibus',
    };
};

export const aTimeTracking_AssignGroupMembersError = (overrides?: Partial<TimeTracking_AssignGroupMembersError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_AssignGroupMembersError' } & TimeTracking_AssignGroupMembersError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AssignGroupMembersError');
    return {
        __typename: 'TimeTracking_AssignGroupMembersError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'voluptatem',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'vel',
        groupId: overrides && overrides.hasOwnProperty('groupId') ? overrides.groupId! : 'optio',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'dolor',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'qui',
    };
};

export const aTimeTracking_AssignGroupMembersInput = (overrides?: Partial<TimeTracking_AssignGroupMembersInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_AssignGroupMembersInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AssignGroupMembersInput');
    return {
        groupId: overrides && overrides.hasOwnProperty('groupId') ? overrides.groupId! : '6f96c7f1-7c0a-4e4f-a4da-e5230bf0bf54',
        members: overrides && overrides.hasOwnProperty('members') ? overrides.members! : [relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_AssignGroupMembersPayload = (overrides?: Partial<TimeTracking_AssignGroupMembersPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_AssignGroupMembersPayload' } & TimeTracking_AssignGroupMembersPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AssignGroupMembersPayload');
    return {
        __typename: 'TimeTracking_AssignGroupMembersPayload',
        assignmentResults: overrides && overrides.hasOwnProperty('assignmentResults') ? overrides.assignmentResults! : [relationshipsToOmit.has('TimeTracking_GroupMemberAssignmentError') ? {} as TimeTracking_GroupMemberAssignmentError : aTimeTracking_GroupMemberAssignmentError({}, relationshipsToOmit)],
        group: overrides && overrides.hasOwnProperty('group') ? overrides.group! : relationshipsToOmit.has('TimeTracking_Group') ? {} as TimeTracking_Group : aTimeTracking_Group({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'aspernatur',
    };
};

export const aTimeTracking_AssignedCustomer = (overrides?: Partial<TimeTracking_AssignedCustomer>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_AssignedCustomer' } & TimeTracking_AssignedCustomer => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AssignedCustomer');
    return {
        __typename: 'TimeTracking_AssignedCustomer',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'c42b9da9-6d6c-4873-83a1-aa4b2d6a1aba',
    };
};

export const aTimeTracking_AssignedGroup = (overrides?: Partial<TimeTracking_AssignedGroup>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_AssignedGroup' } & TimeTracking_AssignedGroup => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AssignedGroup');
    return {
        __typename: 'TimeTracking_AssignedGroup',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'f7b51091-bdbf-46a9-a793-2fb07031dc0c',
    };
};

export const aTimeTracking_AssignedStandardField = (overrides?: Partial<TimeTracking_AssignedStandardField>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_AssignedStandardField' } & TimeTracking_AssignedStandardField => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AssignedStandardField');
    return {
        __typename: 'TimeTracking_AssignedStandardField',
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'minus',
    };
};

export const aTimeTracking_AssignedWorker = (overrides?: Partial<TimeTracking_AssignedWorker>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_AssignedWorker' } & TimeTracking_AssignedWorker => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AssignedWorker');
    return {
        __typename: 'TimeTracking_AssignedWorker',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '8eecee19-b63d-4b9e-aba9-ab97448ae2c6',
    };
};

export const aTimeTracking_AssignmentItemError = (overrides?: Partial<TimeTracking_AssignmentItemError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_AssignmentItemError' } & TimeTracking_AssignmentItemError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AssignmentItemError');
    return {
        __typename: 'TimeTracking_AssignmentItemError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'rerum',
        element: overrides && overrides.hasOwnProperty('element') ? overrides.element! : '2bb47b27-9308-4345-821c-21da90146956',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'ut',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'perspiciatis',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'fugiat',
    };
};

export const aTimeTracking_AttachmentInfo = (overrides?: Partial<TimeTracking_AttachmentInfo>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_AttachmentInfo' } & TimeTracking_AttachmentInfo => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AttachmentInfo');
    return {
        __typename: 'TimeTracking_AttachmentInfo',
        documentId: overrides && overrides.hasOwnProperty('documentId') ? overrides.documentId! : 'aut',
        fileDescription: overrides && overrides.hasOwnProperty('fileDescription') ? overrides.fileDescription! : 'similique',
        fileName: overrides && overrides.hasOwnProperty('fileName') ? overrides.fileName! : 'nobis',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'ad2bf415-04e2-41c9-a675-351ca05cbc99',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_AttachmentMetaData') ? {} as TimeTracking_AttachmentMetaData : aTimeTracking_AttachmentMetaData({}, relationshipsToOmit),
        orientationDegree: overrides && overrides.hasOwnProperty('orientationDegree') ? overrides.orientationDegree! : 2292,
        timeEntryId: overrides && overrides.hasOwnProperty('timeEntryId') ? overrides.timeEntryId! : '32702b20-b1ef-429c-80b4-0124b1b9fb1c',
    };
};

export const aTimeTracking_AttachmentInfoConnection = (overrides?: Partial<TimeTracking_AttachmentInfoConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_AttachmentInfoConnection' } & TimeTracking_AttachmentInfoConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AttachmentInfoConnection');
    return {
        __typename: 'TimeTracking_AttachmentInfoConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_AttachmentInfoEdge') ? {} as TimeTracking_AttachmentInfoEdge : aTimeTracking_AttachmentInfoEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_AttachmentInfoEdge = (overrides?: Partial<TimeTracking_AttachmentInfoEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_AttachmentInfoEdge' } & TimeTracking_AttachmentInfoEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AttachmentInfoEdge');
    return {
        __typename: 'TimeTracking_AttachmentInfoEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'distinctio',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_AttachmentInfo') ? {} as TimeTracking_AttachmentInfo : aTimeTracking_AttachmentInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_AttachmentMetaData = (overrides?: Partial<TimeTracking_AttachmentMetaData>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_AttachmentMetaData' } & TimeTracking_AttachmentMetaData => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AttachmentMetaData');
    return {
        __typename: 'TimeTracking_AttachmentMetaData',
        createdAt: overrides && overrides.hasOwnProperty('createdAt') ? overrides.createdAt! : 'hic',
        createdBy: overrides && overrides.hasOwnProperty('createdBy') ? overrides.createdBy! : 'sit',
        updatedAt: overrides && overrides.hasOwnProperty('updatedAt') ? overrides.updatedAt! : 'vero',
        updatedBy: overrides && overrides.hasOwnProperty('updatedBy') ? overrides.updatedBy! : 'dolores',
    };
};

export const aTimeTracking_AttachmentsInputFilter = (overrides?: Partial<TimeTracking_AttachmentsInputFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_AttachmentsInputFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AttachmentsInputFilter');
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : ['6966590f-19c6-4dc5-bde4-330f3c206a97'],
        timeEntryId: overrides && overrides.hasOwnProperty('timeEntryId') ? overrides.timeEntryId! : '3f2d1c11-03d8-48ba-be8a-fff99ee7464b',
    };
};

export const aTimeTracking_AttachmentsMutationError = (overrides?: Partial<TimeTracking_AttachmentsMutationError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_AttachmentsMutationError' } & TimeTracking_AttachmentsMutationError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_AttachmentsMutationError');
    return {
        __typename: 'TimeTracking_AttachmentsMutationError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'deserunt',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'eligendi',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'exercitationem',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'voluptate',
    };
};

export const aTimeTracking_BatchCreateUpdateTimeEntryInput = (overrides?: Partial<TimeTracking_BatchCreateUpdateTimeEntryInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_BatchCreateUpdateTimeEntryInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_BatchCreateUpdateTimeEntryInput');
    return {
        billableRate: overrides && overrides.hasOwnProperty('billableRate') ? overrides.billableRate! : 'repudiandae',
        billableStatus: overrides && overrides.hasOwnProperty('billableStatus') ? overrides.billableStatus! : TimeTracking_BillableStatus.Billable,
        classID: overrides && overrides.hasOwnProperty('classID') ? overrides.classID! : '75a1c52d-2c98-48ad-a3f8-e3085b2b29cc',
        costRate: overrides && overrides.hasOwnProperty('costRate') ? overrides.costRate! : 'dolorem',
        customExtensions: overrides && overrides.hasOwnProperty('customExtensions') ? overrides.customExtensions! : relationshipsToOmit.has('TimeTracking_CustomExtensionsInput') ? {} as TimeTracking_CustomExtensionsInput : aTimeTracking_CustomExtensionsInput({}, relationshipsToOmit),
        customFields: overrides && overrides.hasOwnProperty('customFields') ? overrides.customFields! : [relationshipsToOmit.has('TimeTracking_CustomFieldInput') ? {} as TimeTracking_CustomFieldInput : aTimeTracking_CustomFieldInput({}, relationshipsToOmit)],
        date: overrides && overrides.hasOwnProperty('date') ? overrides.date! : '1970-01-07T22:51:45.106Z',
        departmentID: overrides && overrides.hasOwnProperty('departmentID') ? overrides.departmentID! : 'c6de838c-9d99-4cb1-ac19-7798bfc4baa7',
        departmentLabel: overrides && overrides.hasOwnProperty('departmentLabel') ? overrides.departmentLabel! : 'et',
        duration: overrides && overrides.hasOwnProperty('duration') ? overrides.duration! : 5014,
        endTime: overrides && overrides.hasOwnProperty('endTime') ? overrides.endTime! : 'maiores',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '08a32fa5-be85-43cf-88de-1e3ef2b0aee1',
        notes: overrides && overrides.hasOwnProperty('notes') ? overrides.notes! : 'consequatur',
        payrollItemID: overrides && overrides.hasOwnProperty('payrollItemID') ? overrides.payrollItemID! : '60862013-3fb0-4f5a-bf40-e7e6d690e9ba',
        serviceItemID: overrides && overrides.hasOwnProperty('serviceItemID') ? overrides.serviceItemID! : '42d5faae-a2ae-483d-accf-8e0abf4cdd9f',
        sparse: overrides && overrides.hasOwnProperty('sparse') ? overrides.sparse! : true,
        startTime: overrides && overrides.hasOwnProperty('startTime') ? overrides.startTime! : 'perferendis',
        taxable: overrides && overrides.hasOwnProperty('taxable') ? overrides.taxable! : true,
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainstInput') ? {} as TimeTracking_TrackTimeAgainstInput : aTimeTracking_TrackTimeAgainstInput({}, relationshipsToOmit),
        timeBreakId: overrides && overrides.hasOwnProperty('timeBreakId') ? overrides.timeBreakId! : '85ba5d3d-08a1-46b6-b436-fd336b389f81',
        timeFor: overrides && overrides.hasOwnProperty('timeFor') ? overrides.timeFor! : relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit),
        v3BreakDuration: overrides && overrides.hasOwnProperty('v3BreakDuration') ? overrides.v3BreakDuration! : 5121,
        v3BreakDurationDetails: overrides && overrides.hasOwnProperty('v3BreakDurationDetails') ? overrides.v3BreakDurationDetails! : relationshipsToOmit.has('TimeTracking_V3BreakDurationDetailsInput') ? {} as TimeTracking_V3BreakDurationDetailsInput : aTimeTracking_V3BreakDurationDetailsInput({}, relationshipsToOmit),
        v3DurationDetails: overrides && overrides.hasOwnProperty('v3DurationDetails') ? overrides.v3DurationDetails! : relationshipsToOmit.has('TimeTracking_V3DurationDetailsInput') ? {} as TimeTracking_V3DurationDetailsInput : aTimeTracking_V3DurationDetailsInput({}, relationshipsToOmit),
        v3TransactionLocationType: overrides && overrides.hasOwnProperty('v3TransactionLocationType') ? overrides.v3TransactionLocationType! : TimeTracking_V3TransactionLocationType.FranceOverseas,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'voluptatibus',
    };
};

export const aTimeTracking_BatchManageDeleteTimeEntryInput = (overrides?: Partial<TimeTracking_BatchManageDeleteTimeEntryInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_BatchManageDeleteTimeEntryInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_BatchManageDeleteTimeEntryInput');
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '7c0788a7-2e75-4390-9e8c-1bb0f46a6854',
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'voluptates',
    };
};

export const aTimeTracking_BatchManageTimeEntriesError = (overrides?: Partial<TimeTracking_BatchManageTimeEntriesError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_BatchManageTimeEntriesError' } & TimeTracking_BatchManageTimeEntriesError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_BatchManageTimeEntriesError');
    return {
        __typename: 'TimeTracking_BatchManageTimeEntriesError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'repellat',
        element: overrides && overrides.hasOwnProperty('element') ? overrides.element! : 'ut',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'qui',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'adipisci',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'repellat',
    };
};

export const aTimeTracking_BatchManageTimeEntriesInput = (overrides?: Partial<TimeTracking_BatchManageTimeEntriesInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_BatchManageTimeEntriesInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_BatchManageTimeEntriesInput');
    return {
        closedBookPassword: overrides && overrides.hasOwnProperty('closedBookPassword') ? overrides.closedBookPassword! : 'voluptatem',
        isExported: overrides && overrides.hasOwnProperty('isExported') ? overrides.isExported! : false,
        timeEntries: overrides && overrides.hasOwnProperty('timeEntries') ? overrides.timeEntries! : [relationshipsToOmit.has('TimeTracking_BatchCreateUpdateTimeEntryInput') ? {} as TimeTracking_BatchCreateUpdateTimeEntryInput : aTimeTracking_BatchCreateUpdateTimeEntryInput({}, relationshipsToOmit)],
        timeEntriesToDelete: overrides && overrides.hasOwnProperty('timeEntriesToDelete') ? overrides.timeEntriesToDelete! : [relationshipsToOmit.has('TimeTracking_BatchManageDeleteTimeEntryInput') ? {} as TimeTracking_BatchManageDeleteTimeEntryInput : aTimeTracking_BatchManageDeleteTimeEntryInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_BatchManageTimeEntriesPayload = (overrides?: Partial<TimeTracking_BatchManageTimeEntriesPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_BatchManageTimeEntriesPayload' } & TimeTracking_BatchManageTimeEntriesPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_BatchManageTimeEntriesPayload');
    return {
        __typename: 'TimeTracking_BatchManageTimeEntriesPayload',
        deletes: overrides && overrides.hasOwnProperty('deletes') ? overrides.deletes! : ['1de007ba-a846-40c4-9ac9-48dd4bf7ba4c'],
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'dolore',
        timeEntries: overrides && overrides.hasOwnProperty('timeEntries') ? overrides.timeEntries! : [relationshipsToOmit.has('TimeTracking_TimeEntry') ? {} as TimeTracking_TimeEntry : aTimeTracking_TimeEntry({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_ClockInOutRoundingSettings = (overrides?: Partial<TimeTracking_ClockInOutRoundingSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ClockInOutRoundingSettings' } & TimeTracking_ClockInOutRoundingSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ClockInOutRoundingSettings');
    return {
        __typename: 'TimeTracking_ClockInOutRoundingSettings',
        direction: overrides && overrides.hasOwnProperty('direction') ? overrides.direction! : relationshipsToOmit.has('TimeTracking_SettingString') ? {} as TimeTracking_SettingString : aTimeTracking_SettingString({}, relationshipsToOmit),
        roundInMin: overrides && overrides.hasOwnProperty('roundInMin') ? overrides.roundInMin! : relationshipsToOmit.has('TimeTracking_SettingInteger') ? {} as TimeTracking_SettingInteger : aTimeTracking_SettingInteger({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ClockInOutRoundingSettingsInput = (overrides?: Partial<TimeTracking_ClockInOutRoundingSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ClockInOutRoundingSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ClockInOutRoundingSettingsInput');
    return {
        direction: overrides && overrides.hasOwnProperty('direction') ? overrides.direction! : relationshipsToOmit.has('TimeTracking_UpdateSettingStringInput') ? {} as TimeTracking_UpdateSettingStringInput : aTimeTracking_UpdateSettingStringInput({}, relationshipsToOmit),
        roundInMin: overrides && overrides.hasOwnProperty('roundInMin') ? overrides.roundInMin! : relationshipsToOmit.has('TimeTracking_UpdateSettingIntegerInput') ? {} as TimeTracking_UpdateSettingIntegerInput : aTimeTracking_UpdateSettingIntegerInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ClockOutOverrideNotificationSettings = (overrides?: Partial<TimeTracking_ClockOutOverrideNotificationSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ClockOutOverrideNotificationSettings' } & TimeTracking_ClockOutOverrideNotificationSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ClockOutOverrideNotificationSettings');
    return {
        __typename: 'TimeTracking_ClockOutOverrideNotificationSettings',
        adminEnabled: overrides && overrides.hasOwnProperty('adminEnabled') ? overrides.adminEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        groupManagerEnabled: overrides && overrides.hasOwnProperty('groupManagerEnabled') ? overrides.groupManagerEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ContentAttachment = (overrides?: Partial<TimeTracking_ContentAttachment>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ContentAttachment' } & TimeTracking_ContentAttachment => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ContentAttachment');
    return {
        __typename: 'TimeTracking_ContentAttachment',
        documentId: overrides && overrides.hasOwnProperty('documentId') ? overrides.documentId! : 'placeat',
        fileName: overrides && overrides.hasOwnProperty('fileName') ? overrides.fileName! : 'animi',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '7d477019-9c1b-4634-8c1b-c707c6489864',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_AttachmentMetaData') ? {} as TimeTracking_AttachmentMetaData : aTimeTracking_AttachmentMetaData({}, relationshipsToOmit),
        orientationDegree: overrides && overrides.hasOwnProperty('orientationDegree') ? overrides.orientationDegree! : 1071,
    };
};

export const aTimeTracking_CoreEmployerSettings = (overrides?: Partial<TimeTracking_CoreEmployerSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CoreEmployerSettings' } & TimeTracking_CoreEmployerSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CoreEmployerSettings');
    return {
        __typename: 'TimeTracking_CoreEmployerSettings',
        classRequired: overrides && overrides.hasOwnProperty('classRequired') ? overrides.classRequired! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        locationRequired: overrides && overrides.hasOwnProperty('locationRequired') ? overrides.locationRequired! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        requireBillable: overrides && overrides.hasOwnProperty('requireBillable') ? overrides.requireBillable! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        serviceItemRequired: overrides && overrides.hasOwnProperty('serviceItemRequired') ? overrides.serviceItemRequired! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CoreEmployerSettingsInput = (overrides?: Partial<TimeTracking_CoreEmployerSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CoreEmployerSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CoreEmployerSettingsInput');
    return {
        classRequired: overrides && overrides.hasOwnProperty('classRequired') ? overrides.classRequired! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        locationRequired: overrides && overrides.hasOwnProperty('locationRequired') ? overrides.locationRequired! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        requireBillable: overrides && overrides.hasOwnProperty('requireBillable') ? overrides.requireBillable! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        serviceItemRequired: overrides && overrides.hasOwnProperty('serviceItemRequired') ? overrides.serviceItemRequired! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CreateAttachmentInput = (overrides?: Partial<TimeTracking_CreateAttachmentInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CreateAttachmentInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateAttachmentInput');
    return {
        description: overrides && overrides.hasOwnProperty('description') ? overrides.description! : 'aliquid',
        documentId: overrides && overrides.hasOwnProperty('documentId') ? overrides.documentId! : 'debitis',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'doloribus',
        orientationDegree: overrides && overrides.hasOwnProperty('orientationDegree') ? overrides.orientationDegree! : 9621,
    };
};

export const aTimeTracking_CreateAttachmentsInput = (overrides?: Partial<TimeTracking_CreateAttachmentsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CreateAttachmentsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateAttachmentsInput');
    return {
        attachments: overrides && overrides.hasOwnProperty('attachments') ? overrides.attachments! : [relationshipsToOmit.has('TimeTracking_CreateAttachmentInput') ? {} as TimeTracking_CreateAttachmentInput : aTimeTracking_CreateAttachmentInput({}, relationshipsToOmit)],
        postId: overrides && overrides.hasOwnProperty('postId') ? overrides.postId! : '74e72a29-c64a-4619-8d6c-e55abfedfae1',
        timeEntryId: overrides && overrides.hasOwnProperty('timeEntryId') ? overrides.timeEntryId! : '18dc3d26-e337-4a41-a93c-5b97674511d8',
    };
};

export const aTimeTracking_CreateAttachmentsPayload = (overrides?: Partial<TimeTracking_CreateAttachmentsPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CreateAttachmentsPayload' } & TimeTracking_CreateAttachmentsPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateAttachmentsPayload');
    return {
        __typename: 'TimeTracking_CreateAttachmentsPayload',
        attachments: overrides && overrides.hasOwnProperty('attachments') ? overrides.attachments! : [relationshipsToOmit.has('TimeTracking_AttachmentInfo') ? {} as TimeTracking_AttachmentInfo : aTimeTracking_AttachmentInfo({}, relationshipsToOmit)],
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'consectetur',
    };
};

export const aTimeTracking_CreateFlagInput = (overrides?: Partial<TimeTracking_CreateFlagInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CreateFlagInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateFlagInput');
    return {
        flagTime: overrides && overrides.hasOwnProperty('flagTime') ? overrides.flagTime! : 'vitae',
        flagType: overrides && overrides.hasOwnProperty('flagType') ? overrides.flagType! : TimeTracking_FlagType.BatterySaverEnabled,
        note: overrides && overrides.hasOwnProperty('note') ? overrides.note! : 'rerum',
        timeFor: overrides && overrides.hasOwnProperty('timeFor') ? overrides.timeFor! : relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CreateFlagMapsInput = (overrides?: Partial<TimeTracking_CreateFlagMapsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CreateFlagMapsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateFlagMapsInput');
    return {
        entities: overrides && overrides.hasOwnProperty('entities') ? overrides.entities! : [relationshipsToOmit.has('TimeTracking_FlagEntityInput') ? {} as TimeTracking_FlagEntityInput : aTimeTracking_FlagEntityInput({}, relationshipsToOmit)],
        flagId: overrides && overrides.hasOwnProperty('flagId') ? overrides.flagId! : '478f2480-c50c-47d8-9d1e-44accc0b64c1',
    };
};

export const aTimeTracking_CreateFlagMapsPayload = (overrides?: Partial<TimeTracking_CreateFlagMapsPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CreateFlagMapsPayload' } & TimeTracking_CreateFlagMapsPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateFlagMapsPayload');
    return {
        __typename: 'TimeTracking_CreateFlagMapsPayload',
        flagMaps: overrides && overrides.hasOwnProperty('flagMaps') ? overrides.flagMaps! : [relationshipsToOmit.has('TimeTracking_FlagMap') ? {} as TimeTracking_FlagMap : aTimeTracking_FlagMap({}, relationshipsToOmit)],
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'quo',
    };
};

export const aTimeTracking_CreateFlagPayload = (overrides?: Partial<TimeTracking_CreateFlagPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CreateFlagPayload' } & TimeTracking_CreateFlagPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateFlagPayload');
    return {
        __typename: 'TimeTracking_CreateFlagPayload',
        flag: overrides && overrides.hasOwnProperty('flag') ? overrides.flag! : relationshipsToOmit.has('TimeTracking_Flag') ? {} as TimeTracking_Flag : aTimeTracking_Flag({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'asperiores',
    };
};

export const aTimeTracking_CreateGroupError = (overrides?: Partial<TimeTracking_CreateGroupError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CreateGroupError' } & TimeTracking_CreateGroupError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateGroupError');
    return {
        __typename: 'TimeTracking_CreateGroupError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'temporibus',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'placeat',
        groupName: overrides && overrides.hasOwnProperty('groupName') ? overrides.groupName! : 'harum',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'sit',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'sequi',
    };
};

export const aTimeTracking_CreateGroupInput = (overrides?: Partial<TimeTracking_CreateGroupInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CreateGroupInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateGroupInput');
    return {
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'qui',
    };
};

export const aTimeTracking_CreateGroupPayload = (overrides?: Partial<TimeTracking_CreateGroupPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CreateGroupPayload' } & TimeTracking_CreateGroupPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateGroupPayload');
    return {
        __typename: 'TimeTracking_CreateGroupPayload',
        group: overrides && overrides.hasOwnProperty('group') ? overrides.group! : relationshipsToOmit.has('TimeTracking_Group') ? {} as TimeTracking_Group : aTimeTracking_Group({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'blanditiis',
    };
};

export const aTimeTracking_CreateLocationPointInput = (overrides?: Partial<TimeTracking_CreateLocationPointInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CreateLocationPointInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateLocationPointInput');
    return {
        accuracy: overrides && overrides.hasOwnProperty('accuracy') ? overrides.accuracy! : 'eius',
        altitude: overrides && overrides.hasOwnProperty('altitude') ? overrides.altitude! : 'modi',
        confidence: overrides && overrides.hasOwnProperty('confidence') ? overrides.confidence! : 'sed',
        createdAt: overrides && overrides.hasOwnProperty('createdAt') ? overrides.createdAt! : 'fugit',
        deviceIdentifier: overrides && overrides.hasOwnProperty('deviceIdentifier') ? overrides.deviceIdentifier! : 'quasi',
        latitude: overrides && overrides.hasOwnProperty('latitude') ? overrides.latitude! : 'quia',
        longitude: overrides && overrides.hasOwnProperty('longitude') ? overrides.longitude! : 'omnis',
        source: overrides && overrides.hasOwnProperty('source') ? overrides.source! : 'fugit',
        speed: overrides && overrides.hasOwnProperty('speed') ? overrides.speed! : 'dolores',
    };
};

export const aTimeTracking_CreateLocationPointsError = (overrides?: Partial<TimeTracking_CreateLocationPointsError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CreateLocationPointsError' } & TimeTracking_CreateLocationPointsError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateLocationPointsError');
    return {
        __typename: 'TimeTracking_CreateLocationPointsError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'quam',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'doloribus',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'odit',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'sint',
    };
};

export const aTimeTracking_CreateLocationPointsInput = (overrides?: Partial<TimeTracking_CreateLocationPointsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CreateLocationPointsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateLocationPointsInput');
    return {
        locationPoints: overrides && overrides.hasOwnProperty('locationPoints') ? overrides.locationPoints! : [relationshipsToOmit.has('TimeTracking_CreateLocationPointInput') ? {} as TimeTracking_CreateLocationPointInput : aTimeTracking_CreateLocationPointInput({}, relationshipsToOmit)],
        timeFor: overrides && overrides.hasOwnProperty('timeFor') ? overrides.timeFor! : relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CreateLocationPointsPayload = (overrides?: Partial<TimeTracking_CreateLocationPointsPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CreateLocationPointsPayload' } & TimeTracking_CreateLocationPointsPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateLocationPointsPayload');
    return {
        __typename: 'TimeTracking_CreateLocationPointsPayload',
        createdLocationPoints: overrides && overrides.hasOwnProperty('createdLocationPoints') ? overrides.createdLocationPoints! : relationshipsToOmit.has('TimeTracking_CreatedLocationPoints') ? {} as TimeTracking_CreatedLocationPoints : aTimeTracking_CreatedLocationPoints({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'quidem',
    };
};

export const aTimeTracking_CreateOvertimeNotificationRuleInput = (overrides?: Partial<TimeTracking_CreateOvertimeNotificationRuleInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CreateOvertimeNotificationRuleInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateOvertimeNotificationRuleInput');
    return {
        alertFrequency: overrides && overrides.hasOwnProperty('alertFrequency') ? overrides.alertFrequency! : relationshipsToOmit.has('TimeTracking_OvertimeAlertFrequencyInput') ? {} as TimeTracking_OvertimeAlertFrequencyInput : aTimeTracking_OvertimeAlertFrequencyInput({}, relationshipsToOmit),
        recipients: overrides && overrides.hasOwnProperty('recipients') ? overrides.recipients! : relationshipsToOmit.has('TimeTracking_OvertimeAlertRecipientsInput') ? {} as TimeTracking_OvertimeAlertRecipientsInput : aTimeTracking_OvertimeAlertRecipientsInput({}, relationshipsToOmit),
        threshold: overrides && overrides.hasOwnProperty('threshold') ? overrides.threshold! : relationshipsToOmit.has('TimeTracking_OvertimeThresholdInput') ? {} as TimeTracking_OvertimeThresholdInput : aTimeTracking_OvertimeThresholdInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CreateProjectEstimateError = (overrides?: Partial<TimeTracking_CreateProjectEstimateError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CreateProjectEstimateError' } & TimeTracking_CreateProjectEstimateError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateProjectEstimateError');
    return {
        __typename: 'TimeTracking_CreateProjectEstimateError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'ducimus',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'et',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'dignissimos',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'in',
    };
};

export const aTimeTracking_CreateProjectEstimateInput = (overrides?: Partial<TimeTracking_CreateProjectEstimateInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CreateProjectEstimateInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateProjectEstimateInput');
    return {
        fieldOptionEstimates: overrides && overrides.hasOwnProperty('fieldOptionEstimates') ? overrides.fieldOptionEstimates! : [relationshipsToOmit.has('TimeTracking_FieldOptionEstimateInput') ? {} as TimeTracking_FieldOptionEstimateInput : aTimeTracking_FieldOptionEstimateInput({}, relationshipsToOmit)],
        fieldRef: overrides && overrides.hasOwnProperty('fieldRef') ? overrides.fieldRef! : 'illo',
        fieldType: overrides && overrides.hasOwnProperty('fieldType') ? overrides.fieldType! : TimeTracking_FieldType.CustomField,
        projectEstimateType: overrides && overrides.hasOwnProperty('projectEstimateType') ? overrides.projectEstimateType! : TimeTracking_ProjectEstimateType.ByFieldOption,
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : '5d455e66-4b3d-4507-9c72-31fe36e2f720',
        totalEstimatedSeconds: overrides && overrides.hasOwnProperty('totalEstimatedSeconds') ? overrides.totalEstimatedSeconds! : 'et',
    };
};

export const aTimeTracking_CreateProjectEstimatePayload = (overrides?: Partial<TimeTracking_CreateProjectEstimatePayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CreateProjectEstimatePayload' } & TimeTracking_CreateProjectEstimatePayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateProjectEstimatePayload');
    return {
        __typename: 'TimeTracking_CreateProjectEstimatePayload',
        projectEstimate: overrides && overrides.hasOwnProperty('projectEstimate') ? overrides.projectEstimate! : relationshipsToOmit.has('TimeTracking_ProjectEstimate') ? {} as TimeTracking_ProjectEstimate : aTimeTracking_ProjectEstimate({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'vitae',
    };
};

export const aTimeTracking_CreateTimeEntryError = (overrides?: Partial<TimeTracking_CreateTimeEntryError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CreateTimeEntryError' } & TimeTracking_CreateTimeEntryError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateTimeEntryError');
    return {
        __typename: 'TimeTracking_CreateTimeEntryError',
        detailLocalizationArgs: overrides && overrides.hasOwnProperty('detailLocalizationArgs') ? overrides.detailLocalizationArgs! : ['est'],
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'quis',
        element: overrides && overrides.hasOwnProperty('element') ? overrides.element! : 'est',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'est',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'rerum',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'ea',
    };
};

export const aTimeTracking_CreateTimeEntryInput = (overrides?: Partial<TimeTracking_CreateTimeEntryInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CreateTimeEntryInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateTimeEntryInput');
    return {
        billableRate: overrides && overrides.hasOwnProperty('billableRate') ? overrides.billableRate! : 'ea',
        billableStatus: overrides && overrides.hasOwnProperty('billableStatus') ? overrides.billableStatus! : TimeTracking_BillableStatus.Billable,
        classID: overrides && overrides.hasOwnProperty('classID') ? overrides.classID! : 'dccc3ccd-29b5-4d22-a031-1a849fa3f94e',
        closedBookPassword: overrides && overrides.hasOwnProperty('closedBookPassword') ? overrides.closedBookPassword! : 'dolores',
        costRate: overrides && overrides.hasOwnProperty('costRate') ? overrides.costRate! : 'explicabo',
        customExtensions: overrides && overrides.hasOwnProperty('customExtensions') ? overrides.customExtensions! : relationshipsToOmit.has('TimeTracking_CustomExtensionsInput') ? {} as TimeTracking_CustomExtensionsInput : aTimeTracking_CustomExtensionsInput({}, relationshipsToOmit),
        customFields: overrides && overrides.hasOwnProperty('customFields') ? overrides.customFields! : [relationshipsToOmit.has('TimeTracking_CustomFieldInput') ? {} as TimeTracking_CustomFieldInput : aTimeTracking_CustomFieldInput({}, relationshipsToOmit)],
        date: overrides && overrides.hasOwnProperty('date') ? overrides.date! : '1970-01-01T12:44:00.899Z',
        departmentID: overrides && overrides.hasOwnProperty('departmentID') ? overrides.departmentID! : 'c9d561e4-f7e3-4614-8cf2-763ffba0ed97',
        departmentLabel: overrides && overrides.hasOwnProperty('departmentLabel') ? overrides.departmentLabel! : 'consequatur',
        duration: overrides && overrides.hasOwnProperty('duration') ? overrides.duration! : 8998,
        endTime: overrides && overrides.hasOwnProperty('endTime') ? overrides.endTime! : 'sunt',
        isExported: overrides && overrides.hasOwnProperty('isExported') ? overrides.isExported! : true,
        notes: overrides && overrides.hasOwnProperty('notes') ? overrides.notes! : 'dignissimos',
        payrollItemID: overrides && overrides.hasOwnProperty('payrollItemID') ? overrides.payrollItemID! : '42abfd4b-e5d0-409e-b91b-6d923e59e1c3',
        serviceItemID: overrides && overrides.hasOwnProperty('serviceItemID') ? overrides.serviceItemID! : '3dd1419a-829f-430d-89e3-3d4e7d2a2fd3',
        startTime: overrides && overrides.hasOwnProperty('startTime') ? overrides.startTime! : 'et',
        taxable: overrides && overrides.hasOwnProperty('taxable') ? overrides.taxable! : false,
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainstInput') ? {} as TimeTracking_TrackTimeAgainstInput : aTimeTracking_TrackTimeAgainstInput({}, relationshipsToOmit),
        timeBreakId: overrides && overrides.hasOwnProperty('timeBreakId') ? overrides.timeBreakId! : 'c7bf4c20-2920-4d2a-8270-3b16e7c125ce',
        timeFor: overrides && overrides.hasOwnProperty('timeFor') ? overrides.timeFor! : relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit),
        timeZone: overrides && overrides.hasOwnProperty('timeZone') ? overrides.timeZone! : 'adipisci',
        v3BreakDuration: overrides && overrides.hasOwnProperty('v3BreakDuration') ? overrides.v3BreakDuration! : 7260,
        v3BreakDurationDetails: overrides && overrides.hasOwnProperty('v3BreakDurationDetails') ? overrides.v3BreakDurationDetails! : relationshipsToOmit.has('TimeTracking_V3BreakDurationDetailsInput') ? {} as TimeTracking_V3BreakDurationDetailsInput : aTimeTracking_V3BreakDurationDetailsInput({}, relationshipsToOmit),
        v3DurationDetails: overrides && overrides.hasOwnProperty('v3DurationDetails') ? overrides.v3DurationDetails! : relationshipsToOmit.has('TimeTracking_V3DurationDetailsInput') ? {} as TimeTracking_V3DurationDetailsInput : aTimeTracking_V3DurationDetailsInput({}, relationshipsToOmit),
        v3TransactionLocationType: overrides && overrides.hasOwnProperty('v3TransactionLocationType') ? overrides.v3TransactionLocationType! : TimeTracking_V3TransactionLocationType.FranceOverseas,
    };
};

export const aTimeTracking_CreateTimeEntryPayload = (overrides?: Partial<TimeTracking_CreateTimeEntryPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CreateTimeEntryPayload' } & TimeTracking_CreateTimeEntryPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreateTimeEntryPayload');
    return {
        __typename: 'TimeTracking_CreateTimeEntryPayload',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'blanditiis',
        timeEntries: overrides && overrides.hasOwnProperty('timeEntries') ? overrides.timeEntries! : [relationshipsToOmit.has('TimeTracking_TimeEntry') ? {} as TimeTracking_TimeEntry : aTimeTracking_TimeEntry({}, relationshipsToOmit)],
        timeEntry: overrides && overrides.hasOwnProperty('timeEntry') ? overrides.timeEntry! : relationshipsToOmit.has('TimeTracking_TimeEntry') ? {} as TimeTracking_TimeEntry : aTimeTracking_TimeEntry({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CreatedLocationPoints = (overrides?: Partial<TimeTracking_CreatedLocationPoints>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CreatedLocationPoints' } & TimeTracking_CreatedLocationPoints => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CreatedLocationPoints');
    return {
        __typename: 'TimeTracking_CreatedLocationPoints',
        locationPoints: overrides && overrides.hasOwnProperty('locationPoints') ? overrides.locationPoints! : [relationshipsToOmit.has('TimeTracking_LocationPoint') ? {} as TimeTracking_LocationPoint : aTimeTracking_LocationPoint({}, relationshipsToOmit)],
        timeFor: overrides && overrides.hasOwnProperty('timeFor') ? overrides.timeFor! : relationshipsToOmit.has('Commerce_Vendor') ? {} as Commerce_Vendor : aCommerce_Vendor({}, relationshipsToOmit),
        timeForContactDAS: overrides && overrides.hasOwnProperty('timeForContactDAS') ? overrides.timeForContactDAS! : relationshipsToOmit.has('DataAccess_Contact') ? {} as DataAccess_Contact : aDataAccess_Contact({}, relationshipsToOmit),
        timeForType: overrides && overrides.hasOwnProperty('timeForType') ? overrides.timeForType! : TimeTracking_TimeForType.Employee,
    };
};

export const aTimeTracking_CustomDimension = (overrides?: Partial<TimeTracking_CustomDimension>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomDimension' } & TimeTracking_CustomDimension => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomDimension');
    return {
        __typename: 'TimeTracking_CustomDimension',
        cleared: overrides && overrides.hasOwnProperty('cleared') ? overrides.cleared! : false,
        dimensionDefinition: overrides && overrides.hasOwnProperty('dimensionDefinition') ? overrides.dimensionDefinition! : relationshipsToOmit.has('AppFoundations_CustomDimensionDefinition') ? {} as AppFoundations_CustomDimensionDefinition : anAppFoundations_CustomDimensionDefinition({}, relationshipsToOmit),
        dimensionValue: overrides && overrides.hasOwnProperty('dimensionValue') ? overrides.dimensionValue! : relationshipsToOmit.has('AppFoundations_CustomDimensionValue') ? {} as AppFoundations_CustomDimensionValue : anAppFoundations_CustomDimensionValue({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomDimensionEdge = (overrides?: Partial<TimeTracking_CustomDimensionEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomDimensionEdge' } & TimeTracking_CustomDimensionEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomDimensionEdge');
    return {
        __typename: 'TimeTracking_CustomDimensionEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'sapiente',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_CustomDimensionNode') ? {} as TimeTracking_CustomDimensionNode : aTimeTracking_CustomDimensionNode({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomDimensionNode = (overrides?: Partial<TimeTracking_CustomDimensionNode>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomDimensionNode' } & TimeTracking_CustomDimensionNode => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomDimensionNode');
    return {
        __typename: 'TimeTracking_CustomDimensionNode',
        active: overrides && overrides.hasOwnProperty('active') ? overrides.active! : true,
        customDimensionDefinition: overrides && overrides.hasOwnProperty('customDimensionDefinition') ? overrides.customDimensionDefinition! : relationshipsToOmit.has('AppFoundations_CustomDimensionDefinition') ? {} as AppFoundations_CustomDimensionDefinition : anAppFoundations_CustomDimensionDefinition({}, relationshipsToOmit),
        enabledForTimeTracking: overrides && overrides.hasOwnProperty('enabledForTimeTracking') ? overrides.enabledForTimeTracking! : true,
        label: overrides && overrides.hasOwnProperty('label') ? overrides.label! : 'dolor',
        required: overrides && overrides.hasOwnProperty('required') ? overrides.required! : true,
        workerDefaultDimensionValue: overrides && overrides.hasOwnProperty('workerDefaultDimensionValue') ? overrides.workerDefaultDimensionValue! : relationshipsToOmit.has('AppFoundations_CustomDimensionValue') ? {} as AppFoundations_CustomDimensionValue : anAppFoundations_CustomDimensionValue({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomDimensionSetting = (overrides?: Partial<TimeTracking_CustomDimensionSetting>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomDimensionSetting' } & TimeTracking_CustomDimensionSetting => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomDimensionSetting');
    return {
        __typename: 'TimeTracking_CustomDimensionSetting',
        dimensionDefinition: overrides && overrides.hasOwnProperty('dimensionDefinition') ? overrides.dimensionDefinition! : relationshipsToOmit.has('AppFoundations_CustomDimensionDefinition') ? {} as AppFoundations_CustomDimensionDefinition : anAppFoundations_CustomDimensionDefinition({}, relationshipsToOmit),
        enabledForTimeTracking: overrides && overrides.hasOwnProperty('enabledForTimeTracking') ? overrides.enabledForTimeTracking! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        required: overrides && overrides.hasOwnProperty('required') ? overrides.required! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomDimensionsConnection = (overrides?: Partial<TimeTracking_CustomDimensionsConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomDimensionsConnection' } & TimeTracking_CustomDimensionsConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomDimensionsConnection');
    return {
        __typename: 'TimeTracking_CustomDimensionsConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_CustomDimensionEdge') ? {} as TimeTracking_CustomDimensionEdge : aTimeTracking_CustomDimensionEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomDimensionsFilter = (overrides?: Partial<TimeTracking_CustomDimensionsFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CustomDimensionsFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomDimensionsFilter');
    return {
        active: overrides && overrides.hasOwnProperty('active') ? overrides.active! : true,
        enabledForTimeTracking: overrides && overrides.hasOwnProperty('enabledForTimeTracking') ? overrides.enabledForTimeTracking! : true,
        timeForId: overrides && overrides.hasOwnProperty('timeForId') ? overrides.timeForId! : relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomExtensionDimension = (overrides?: Partial<TimeTracking_CustomExtensionDimension>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomExtensionDimension' } & TimeTracking_CustomExtensionDimension => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomExtensionDimension');
    return {
        __typename: 'TimeTracking_CustomExtensionDimension',
        definition: overrides && overrides.hasOwnProperty('definition') ? overrides.definition! : relationshipsToOmit.has('AppFoundations_CustomDimensionDefinition') ? {} as AppFoundations_CustomDimensionDefinition : anAppFoundations_CustomDimensionDefinition({}, relationshipsToOmit),
        values: overrides && overrides.hasOwnProperty('values') ? overrides.values! : ['nam'],
    };
};

export const aTimeTracking_CustomExtensionDimensionInput = (overrides?: Partial<TimeTracking_CustomExtensionDimensionInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CustomExtensionDimensionInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomExtensionDimensionInput');
    return {
        definitionId: overrides && overrides.hasOwnProperty('definitionId') ? overrides.definitionId! : '5b5f6938-deae-4b44-8c0d-b5e0d18ee711',
        values: overrides && overrides.hasOwnProperty('values') ? overrides.values! : ['quia'],
    };
};

export const aTimeTracking_CustomExtensions = (overrides?: Partial<TimeTracking_CustomExtensions>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomExtensions' } & TimeTracking_CustomExtensions => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomExtensions');
    return {
        __typename: 'TimeTracking_CustomExtensions',
        dimensions: overrides && overrides.hasOwnProperty('dimensions') ? overrides.dimensions! : [relationshipsToOmit.has('TimeTracking_CustomExtensionDimension') ? {} as TimeTracking_CustomExtensionDimension : aTimeTracking_CustomExtensionDimension({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_CustomExtensionsInput = (overrides?: Partial<TimeTracking_CustomExtensionsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CustomExtensionsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomExtensionsInput');
    return {
        dimensions: overrides && overrides.hasOwnProperty('dimensions') ? overrides.dimensions! : [relationshipsToOmit.has('TimeTracking_CustomExtensionDimensionInput') ? {} as TimeTracking_CustomExtensionDimensionInput : aTimeTracking_CustomExtensionDimensionInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_CustomField = (overrides?: Partial<TimeTracking_CustomField>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomField' } & TimeTracking_CustomField => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomField');
    return {
        __typename: 'TimeTracking_CustomField',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'd7209323-9a06-42a8-8ed6-6ecbeea7a73b',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'nihil',
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : 'nulla',
    };
};

export const aTimeTracking_CustomFieldAssignment = (overrides?: Partial<TimeTracking_CustomFieldAssignment>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomFieldAssignment' } & TimeTracking_CustomFieldAssignment => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldAssignment');
    return {
        __typename: 'TimeTracking_CustomFieldAssignment',
        assigned: overrides && overrides.hasOwnProperty('assigned') ? overrides.assigned! : true,
        assignedToAll: overrides && overrides.hasOwnProperty('assignedToAll') ? overrides.assignedToAll! : true,
        customFieldDefinition: overrides && overrides.hasOwnProperty('customFieldDefinition') ? overrides.customFieldDefinition! : relationshipsToOmit.has('AppFoundations_CustomFieldDefinition') ? {} as AppFoundations_CustomFieldDefinition : anAppFoundations_CustomFieldDefinition({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomFieldAssignmentEdge = (overrides?: Partial<TimeTracking_CustomFieldAssignmentEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomFieldAssignmentEdge' } & TimeTracking_CustomFieldAssignmentEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldAssignmentEdge');
    return {
        __typename: 'TimeTracking_CustomFieldAssignmentEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'omnis',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_CustomFieldAssignment') ? {} as TimeTracking_CustomFieldAssignment : aTimeTracking_CustomFieldAssignment({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomFieldAssignmentsConnection = (overrides?: Partial<TimeTracking_CustomFieldAssignmentsConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomFieldAssignmentsConnection' } & TimeTracking_CustomFieldAssignmentsConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldAssignmentsConnection');
    return {
        __typename: 'TimeTracking_CustomFieldAssignmentsConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_CustomFieldAssignmentEdge') ? {} as TimeTracking_CustomFieldAssignmentEdge : aTimeTracking_CustomFieldAssignmentEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomFieldAssignmentsFilter = (overrides?: Partial<TimeTracking_CustomFieldAssignmentsFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CustomFieldAssignmentsFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldAssignmentsFilter');
    return {
        assigned: overrides && overrides.hasOwnProperty('assigned') ? overrides.assigned! : false,
    };
};

export const aTimeTracking_CustomFieldAssignmentsInput = (overrides?: Partial<TimeTracking_CustomFieldAssignmentsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CustomFieldAssignmentsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldAssignmentsInput');
    return {
        assignToAll: overrides && overrides.hasOwnProperty('assignToAll') ? overrides.assignToAll! : true,
        customFieldIdsToAssign: overrides && overrides.hasOwnProperty('customFieldIdsToAssign') ? overrides.customFieldIdsToAssign! : ['50e94b5f-b505-40e9-a1e4-d5386b7b40ee'],
        customFieldIdsToUnassign: overrides && overrides.hasOwnProperty('customFieldIdsToUnassign') ? overrides.customFieldIdsToUnassign! : ['904be6eb-d7cb-47bd-b82c-2d65dce29f3c'],
    };
};

export const aTimeTracking_CustomFieldAssignmentsQueryInput = (overrides?: Partial<TimeTracking_CustomFieldAssignmentsQueryInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CustomFieldAssignmentsQueryInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldAssignmentsQueryInput');
    return {
        customerId: overrides && overrides.hasOwnProperty('customerId') ? overrides.customerId! : '604f6dc6-9b93-41e8-af34-e0da85b48703',
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : '417d3074-2f08-47d1-80de-b7e943e4424d',
    };
};

export const aTimeTracking_CustomFieldDefinition = (overrides?: Partial<TimeTracking_CustomFieldDefinition>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomFieldDefinition' } & TimeTracking_CustomFieldDefinition => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldDefinition');
    return {
        __typename: 'TimeTracking_CustomFieldDefinition',
        customerAssignmentCount: overrides && overrides.hasOwnProperty('customerAssignmentCount') ? overrides.customerAssignmentCount! : 8921,
        deleted: overrides && overrides.hasOwnProperty('deleted') ? overrides.deleted! : true,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '096b78bf-8240-495a-9113-981fc293e904',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'odit',
        options: overrides && overrides.hasOwnProperty('options') ? overrides.options! : [relationshipsToOmit.has('TimeTracking_CustomFieldOption') ? {} as TimeTracking_CustomFieldOption : aTimeTracking_CustomFieldOption({}, relationshipsToOmit)],
        required: overrides && overrides.hasOwnProperty('required') ? overrides.required! : true,
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : 'est',
    };
};

export const aTimeTracking_CustomFieldDefinitionConnection = (overrides?: Partial<TimeTracking_CustomFieldDefinitionConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomFieldDefinitionConnection' } & TimeTracking_CustomFieldDefinitionConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldDefinitionConnection');
    return {
        __typename: 'TimeTracking_CustomFieldDefinitionConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_CustomFieldDefinitionEdge') ? {} as TimeTracking_CustomFieldDefinitionEdge : aTimeTracking_CustomFieldDefinitionEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
        totalCustomerCount: overrides && overrides.hasOwnProperty('totalCustomerCount') ? overrides.totalCustomerCount! : 5713,
        totalWorkerCount: overrides && overrides.hasOwnProperty('totalWorkerCount') ? overrides.totalWorkerCount! : 592,
    };
};

export const aTimeTracking_CustomFieldDefinitionEdge = (overrides?: Partial<TimeTracking_CustomFieldDefinitionEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomFieldDefinitionEdge' } & TimeTracking_CustomFieldDefinitionEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldDefinitionEdge');
    return {
        __typename: 'TimeTracking_CustomFieldDefinitionEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'voluptatem',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_CustomFieldDefinition') ? {} as TimeTracking_CustomFieldDefinition : aTimeTracking_CustomFieldDefinition({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomFieldInput = (overrides?: Partial<TimeTracking_CustomFieldInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CustomFieldInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldInput');
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '8e7de46f-25f9-42e3-a6be-2400f035c5ce',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'quidem',
        optionID: overrides && overrides.hasOwnProperty('optionID') ? overrides.optionID! : '8181f25f-5ee2-45d0-a80a-b89ff524cbfb',
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : 'aut',
    };
};

export const aTimeTracking_CustomFieldOption = (overrides?: Partial<TimeTracking_CustomFieldOption>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomFieldOption' } & TimeTracking_CustomFieldOption => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldOption');
    return {
        __typename: 'TimeTracking_CustomFieldOption',
        deleted: overrides && overrides.hasOwnProperty('deleted') ? overrides.deleted! : false,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '59f6ee33-9e95-4220-aaa4-c9bedefafa27',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'doloremque',
        timeAgainstAssignmentCount: overrides && overrides.hasOwnProperty('timeAgainstAssignmentCount') ? overrides.timeAgainstAssignmentCount! : 5454,
        workerAssignmentCount: overrides && overrides.hasOwnProperty('workerAssignmentCount') ? overrides.workerAssignmentCount! : 6093,
    };
};

export const aTimeTracking_CustomFieldOptionAssignment = (overrides?: Partial<TimeTracking_CustomFieldOptionAssignment>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomFieldOptionAssignment' } & TimeTracking_CustomFieldOptionAssignment => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldOptionAssignment');
    return {
        __typename: 'TimeTracking_CustomFieldOptionAssignment',
        active: overrides && overrides.hasOwnProperty('active') ? overrides.active! : true,
        assigned: overrides && overrides.hasOwnProperty('assigned') ? overrides.assigned! : true,
        customFieldOption: overrides && overrides.hasOwnProperty('customFieldOption') ? overrides.customFieldOption! : relationshipsToOmit.has('AppFoundations_CustomFieldDefinitionDropDownOption') ? {} as AppFoundations_CustomFieldDefinitionDropDownOption : anAppFoundations_CustomFieldDefinitionDropDownOption({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomFieldOptionAssignmentConnection = (overrides?: Partial<TimeTracking_CustomFieldOptionAssignmentConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomFieldOptionAssignmentConnection' } & TimeTracking_CustomFieldOptionAssignmentConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldOptionAssignmentConnection');
    return {
        __typename: 'TimeTracking_CustomFieldOptionAssignmentConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_CustomFieldOptionAssignmentEdge') ? {} as TimeTracking_CustomFieldOptionAssignmentEdge : aTimeTracking_CustomFieldOptionAssignmentEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomFieldOptionAssignmentDetails = (overrides?: Partial<TimeTracking_CustomFieldOptionAssignmentDetails>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomFieldOptionAssignmentDetails' } & TimeTracking_CustomFieldOptionAssignmentDetails => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldOptionAssignmentDetails');
    return {
        __typename: 'TimeTracking_CustomFieldOptionAssignmentDetails',
        customField: overrides && overrides.hasOwnProperty('customField') ? overrides.customField! : relationshipsToOmit.has('AppFoundations_CustomFieldDefinition') ? {} as AppFoundations_CustomFieldDefinition : anAppFoundations_CustomFieldDefinition({}, relationshipsToOmit),
        customFieldOptions: overrides && overrides.hasOwnProperty('customFieldOptions') ? overrides.customFieldOptions! : [relationshipsToOmit.has('TimeTracking_CustomFieldOptionAssignment') ? {} as TimeTracking_CustomFieldOptionAssignment : aTimeTracking_CustomFieldOptionAssignment({}, relationshipsToOmit)],
        timeFor: overrides && overrides.hasOwnProperty('timeFor') ? overrides.timeFor! : relationshipsToOmit.has('DataAccess_Contact') ? {} as DataAccess_Contact : aDataAccess_Contact({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomFieldOptionAssignmentEdge = (overrides?: Partial<TimeTracking_CustomFieldOptionAssignmentEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomFieldOptionAssignmentEdge' } & TimeTracking_CustomFieldOptionAssignmentEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldOptionAssignmentEdge');
    return {
        __typename: 'TimeTracking_CustomFieldOptionAssignmentEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'quis',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_CustomFieldOptionAssignmentDetails') ? {} as TimeTracking_CustomFieldOptionAssignmentDetails : aTimeTracking_CustomFieldOptionAssignmentDetails({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomFieldOptionAssignmentsFilter = (overrides?: Partial<TimeTracking_CustomFieldOptionAssignmentsFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CustomFieldOptionAssignmentsFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldOptionAssignmentsFilter');
    return {
        active: overrides && overrides.hasOwnProperty('active') ? overrides.active! : false,
        assigned: overrides && overrides.hasOwnProperty('assigned') ? overrides.assigned! : true,
    };
};

export const aTimeTracking_CustomFieldOptionAssignmentsQueryInput = (overrides?: Partial<TimeTracking_CustomFieldOptionAssignmentsQueryInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CustomFieldOptionAssignmentsQueryInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldOptionAssignmentsQueryInput');
    return {
        customFieldIds: overrides && overrides.hasOwnProperty('customFieldIds') ? overrides.customFieldIds! : ['de672baf-8f7b-40f8-b935-1d16314dab78'],
        timeAgainstEntityId: overrides && overrides.hasOwnProperty('timeAgainstEntityId') ? overrides.timeAgainstEntityId! : '32fffd2f-80dd-4463-b486-ea4e700ca28d',
        timeForEntityId: overrides && overrides.hasOwnProperty('timeForEntityId') ? overrides.timeForEntityId! : 'af63f5e2-b868-4c25-83b0-74ba31969caa',
    };
};

export const aTimeTracking_CustomFieldsInputFilter = (overrides?: Partial<TimeTracking_CustomFieldsInputFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CustomFieldsInputFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomFieldsInputFilter');
    return {
        customFieldIds: overrides && overrides.hasOwnProperty('customFieldIds') ? overrides.customFieldIds! : ['blanditiis'],
        deleted: overrides && overrides.hasOwnProperty('deleted') ? overrides.deleted! : false,
        timeAgainstIds: overrides && overrides.hasOwnProperty('timeAgainstIds') ? overrides.timeAgainstIds! : [relationshipsToOmit.has('TimeTracking_TrackTimeAgainstInput') ? {} as TimeTracking_TrackTimeAgainstInput : aTimeTracking_TrackTimeAgainstInput({}, relationshipsToOmit)],
        timeForIds: overrides && overrides.hasOwnProperty('timeForIds') ? overrides.timeForIds! : [relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_CustomerTimeSummary = (overrides?: Partial<TimeTracking_CustomerTimeSummary>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomerTimeSummary' } & TimeTracking_CustomerTimeSummary => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomerTimeSummary');
    return {
        __typename: 'TimeTracking_CustomerTimeSummary',
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainst') ? {} as TimeTracking_TrackTimeAgainst : aTimeTracking_TrackTimeAgainst({}, relationshipsToOmit),
        timeAgainstContactDAS: overrides && overrides.hasOwnProperty('timeAgainstContactDAS') ? overrides.timeAgainstContactDAS! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainstContact') ? {} as TimeTracking_TrackTimeAgainstContact : aTimeTracking_TrackTimeAgainstContact({}, relationshipsToOmit),
        totalDuration: overrides && overrides.hasOwnProperty('totalDuration') ? overrides.totalDuration! : relationshipsToOmit.has('TimeTracking_CustomerTimeSummaryDuration') ? {} as TimeTracking_CustomerTimeSummaryDuration : aTimeTracking_CustomerTimeSummaryDuration({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomerTimeSummaryConnection = (overrides?: Partial<TimeTracking_CustomerTimeSummaryConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomerTimeSummaryConnection' } & TimeTracking_CustomerTimeSummaryConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomerTimeSummaryConnection');
    return {
        __typename: 'TimeTracking_CustomerTimeSummaryConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_CustomerTimeSummaryEdge') ? {} as TimeTracking_CustomerTimeSummaryEdge : aTimeTracking_CustomerTimeSummaryEdge({}, relationshipsToOmit)],
        pageMeta: overrides && overrides.hasOwnProperty('pageMeta') ? overrides.pageMeta! : relationshipsToOmit.has('TimeTracking_PageMeta') ? {} as TimeTracking_PageMeta : aTimeTracking_PageMeta({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomerTimeSummaryDuration = (overrides?: Partial<TimeTracking_CustomerTimeSummaryDuration>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomerTimeSummaryDuration' } & TimeTracking_CustomerTimeSummaryDuration => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomerTimeSummaryDuration');
    return {
        __typename: 'TimeTracking_CustomerTimeSummaryDuration',
        billableSeconds: overrides && overrides.hasOwnProperty('billableSeconds') ? overrides.billableSeconds! : 'asperiores',
        seconds: overrides && overrides.hasOwnProperty('seconds') ? overrides.seconds! : 'sint',
    };
};

export const aTimeTracking_CustomerTimeSummaryEdge = (overrides?: Partial<TimeTracking_CustomerTimeSummaryEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_CustomerTimeSummaryEdge' } & TimeTracking_CustomerTimeSummaryEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomerTimeSummaryEdge');
    return {
        __typename: 'TimeTracking_CustomerTimeSummaryEdge',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_CustomerTimeSummary') ? {} as TimeTracking_CustomerTimeSummary : aTimeTracking_CustomerTimeSummary({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomerTimeSummaryFilter = (overrides?: Partial<TimeTracking_CustomerTimeSummaryFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CustomerTimeSummaryFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomerTimeSummaryFilter');
    return {
        customerIds: overrides && overrides.hasOwnProperty('customerIds') ? overrides.customerIds! : ['8b4f10a8-4d40-490a-9328-90874208927f'],
        dateRange: overrides && overrides.hasOwnProperty('dateRange') ? overrides.dateRange! : relationshipsToOmit.has('TimeTracking_DatePeriod') ? {} as TimeTracking_DatePeriod : aTimeTracking_DatePeriod({}, relationshipsToOmit),
    };
};

export const aTimeTracking_CustomerTimeSummaryInput = (overrides?: Partial<TimeTracking_CustomerTimeSummaryInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_CustomerTimeSummaryInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_CustomerTimeSummaryInput');
    return {
        customerTimeSummaryFilter: overrides && overrides.hasOwnProperty('customerTimeSummaryFilter') ? overrides.customerTimeSummaryFilter! : relationshipsToOmit.has('TimeTracking_CustomerTimeSummaryFilter') ? {} as TimeTracking_CustomerTimeSummaryFilter : aTimeTracking_CustomerTimeSummaryFilter({}, relationshipsToOmit),
        orderBy: overrides && overrides.hasOwnProperty('orderBy') ? overrides.orderBy! : [TimeTracking_CustomerTimeSummaryOrderBy.TotalBillableDurationSecondsAsc],
    };
};

export const aTimeTracking_DailyApprovalReminder = (overrides?: Partial<TimeTracking_DailyApprovalReminder>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_DailyApprovalReminder' } & TimeTracking_DailyApprovalReminder => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DailyApprovalReminder');
    return {
        __typename: 'TimeTracking_DailyApprovalReminder',
        firstReminder: overrides && overrides.hasOwnProperty('firstReminder') ? overrides.firstReminder! : relationshipsToOmit.has('TimeTracking_DailyApprovalReminderDetails') ? {} as TimeTracking_DailyApprovalReminderDetails : aTimeTracking_DailyApprovalReminderDetails({}, relationshipsToOmit),
        reminderForTimesheetDays: overrides && overrides.hasOwnProperty('reminderForTimesheetDays') ? overrides.reminderForTimesheetDays! : relationshipsToOmit.has('TimeTracking_ApprovalReminderDaysOfWeek') ? {} as TimeTracking_ApprovalReminderDaysOfWeek : aTimeTracking_ApprovalReminderDaysOfWeek({}, relationshipsToOmit),
        secondReminder: overrides && overrides.hasOwnProperty('secondReminder') ? overrides.secondReminder! : relationshipsToOmit.has('TimeTracking_DailyApprovalReminderDetails') ? {} as TimeTracking_DailyApprovalReminderDetails : aTimeTracking_DailyApprovalReminderDetails({}, relationshipsToOmit),
    };
};

export const aTimeTracking_DailyApprovalReminderDetails = (overrides?: Partial<TimeTracking_DailyApprovalReminderDetails>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_DailyApprovalReminderDetails' } & TimeTracking_DailyApprovalReminderDetails => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DailyApprovalReminderDetails');
    return {
        __typename: 'TimeTracking_DailyApprovalReminderDetails',
        hour: overrides && overrides.hasOwnProperty('hour') ? overrides.hour! : relationshipsToOmit.has('TimeTracking_SettingInteger') ? {} as TimeTracking_SettingInteger : aTimeTracking_SettingInteger({}, relationshipsToOmit),
        reminderMedium: overrides && overrides.hasOwnProperty('reminderMedium') ? overrides.reminderMedium! : relationshipsToOmit.has('TimeTracking_SettingNotificationMedium') ? {} as TimeTracking_SettingNotificationMedium : aTimeTracking_SettingNotificationMedium({}, relationshipsToOmit),
    };
};

export const aTimeTracking_DailyApprovalReminderDetailsInput = (overrides?: Partial<TimeTracking_DailyApprovalReminderDetailsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_DailyApprovalReminderDetailsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DailyApprovalReminderDetailsInput');
    return {
        hour: overrides && overrides.hasOwnProperty('hour') ? overrides.hour! : relationshipsToOmit.has('TimeTracking_UpdateSettingIntegerInput') ? {} as TimeTracking_UpdateSettingIntegerInput : aTimeTracking_UpdateSettingIntegerInput({}, relationshipsToOmit),
        reminderMedium: overrides && overrides.hasOwnProperty('reminderMedium') ? overrides.reminderMedium! : relationshipsToOmit.has('TimeTracking_UpdateSettingApprovalReminderMediumInput') ? {} as TimeTracking_UpdateSettingApprovalReminderMediumInput : aTimeTracking_UpdateSettingApprovalReminderMediumInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_DailyApprovalReminderInput = (overrides?: Partial<TimeTracking_DailyApprovalReminderInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_DailyApprovalReminderInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DailyApprovalReminderInput');
    return {
        firstReminder: overrides && overrides.hasOwnProperty('firstReminder') ? overrides.firstReminder! : relationshipsToOmit.has('TimeTracking_EmployeeDailyReminderInputSettings') ? {} as TimeTracking_EmployeeDailyReminderInputSettings : aTimeTracking_EmployeeDailyReminderInputSettings({}, relationshipsToOmit),
        reminderForTimesheetDays: overrides && overrides.hasOwnProperty('reminderForTimesheetDays') ? overrides.reminderForTimesheetDays! : relationshipsToOmit.has('TimeTracking_ApprovalReminderDaysOfWeekInput') ? {} as TimeTracking_ApprovalReminderDaysOfWeekInput : aTimeTracking_ApprovalReminderDaysOfWeekInput({}, relationshipsToOmit),
        secondReminder: overrides && overrides.hasOwnProperty('secondReminder') ? overrides.secondReminder! : relationshipsToOmit.has('TimeTracking_EmployeeDailyReminderInputSettings') ? {} as TimeTracking_EmployeeDailyReminderInputSettings : aTimeTracking_EmployeeDailyReminderInputSettings({}, relationshipsToOmit),
    };
};

export const aTimeTracking_DatePeriod = (overrides?: Partial<TimeTracking_DatePeriod>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_DatePeriod => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DatePeriod');
    return {
        beginDate: overrides && overrides.hasOwnProperty('beginDate') ? overrides.beginDate! : '1970-01-05T11:56:29.333Z',
        endDate: overrides && overrides.hasOwnProperty('endDate') ? overrides.endDate! : '1970-01-05T22:30:39.387Z',
    };
};

export const aTimeTracking_DeleteAttachmentsInput = (overrides?: Partial<TimeTracking_DeleteAttachmentsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_DeleteAttachmentsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DeleteAttachmentsInput');
    return {
        attachments: overrides && overrides.hasOwnProperty('attachments') ? overrides.attachments! : ['d4d709fd-ac02-4793-aad1-e7a42e6d1f95'],
        postId: overrides && overrides.hasOwnProperty('postId') ? overrides.postId! : '451b0bdd-b7aa-49aa-bde5-9282905178d5',
    };
};

export const aTimeTracking_DeleteAttachmentsPayload = (overrides?: Partial<TimeTracking_DeleteAttachmentsPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_DeleteAttachmentsPayload' } & TimeTracking_DeleteAttachmentsPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DeleteAttachmentsPayload');
    return {
        __typename: 'TimeTracking_DeleteAttachmentsPayload',
        deleted: overrides && overrides.hasOwnProperty('deleted') ? overrides.deleted! : ['c50f68f2-e250-4d2a-a3be-7872a540c6b2'],
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'quo',
    };
};

export const aTimeTracking_DeleteGroupError = (overrides?: Partial<TimeTracking_DeleteGroupError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_DeleteGroupError' } & TimeTracking_DeleteGroupError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DeleteGroupError');
    return {
        __typename: 'TimeTracking_DeleteGroupError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'voluptates',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'consequatur',
        groupId: overrides && overrides.hasOwnProperty('groupId') ? overrides.groupId! : 'aut',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'sunt',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'debitis',
    };
};

export const aTimeTracking_DeleteGroupInput = (overrides?: Partial<TimeTracking_DeleteGroupInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_DeleteGroupInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DeleteGroupInput');
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '82b1eacb-13c1-4943-a36e-85815ba82140',
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 2161,
    };
};

export const aTimeTracking_DeleteGroupPayload = (overrides?: Partial<TimeTracking_DeleteGroupPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_DeleteGroupPayload' } & TimeTracking_DeleteGroupPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DeleteGroupPayload');
    return {
        __typename: 'TimeTracking_DeleteGroupPayload',
        group: overrides && overrides.hasOwnProperty('group') ? overrides.group! : relationshipsToOmit.has('TimeTracking_Group') ? {} as TimeTracking_Group : aTimeTracking_Group({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'cum',
    };
};

export const aTimeTracking_DeletePostError = (overrides?: Partial<TimeTracking_DeletePostError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_DeletePostError' } & TimeTracking_DeletePostError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DeletePostError');
    return {
        __typename: 'TimeTracking_DeletePostError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'sapiente',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'quia',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'cum',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'maiores',
    };
};

export const aTimeTracking_DeletePostInput = (overrides?: Partial<TimeTracking_DeletePostInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_DeletePostInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DeletePostInput');
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '5b64f320-b6c8-4c9f-b842-6ba3d53d4c9f',
        projectRefs: overrides && overrides.hasOwnProperty('projectRefs') ? overrides.projectRefs! : relationshipsToOmit.has('TimeTracking_PostProjectRefsInput') ? {} as TimeTracking_PostProjectRefsInput : aTimeTracking_PostProjectRefsInput({}, relationshipsToOmit),
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : '13bafb85-9d98-433a-b990-54362c3f6af2',
        workerType: overrides && overrides.hasOwnProperty('workerType') ? overrides.workerType! : 'quis',
    };
};

export const aTimeTracking_DeletePostPayload = (overrides?: Partial<TimeTracking_DeletePostPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_DeletePostPayload' } & TimeTracking_DeletePostPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DeletePostPayload');
    return {
        __typename: 'TimeTracking_DeletePostPayload',
        deletedPostId: overrides && overrides.hasOwnProperty('deletedPostId') ? overrides.deletedPostId! : 'fe8aa369-5b88-4316-aaf3-8c4c6fd6125d',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'voluptatem',
    };
};

export const aTimeTracking_DeleteProjectEstimateError = (overrides?: Partial<TimeTracking_DeleteProjectEstimateError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_DeleteProjectEstimateError' } & TimeTracking_DeleteProjectEstimateError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DeleteProjectEstimateError');
    return {
        __typename: 'TimeTracking_DeleteProjectEstimateError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'quo',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'nesciunt',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'dolor',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'perspiciatis',
    };
};

export const aTimeTracking_DeleteProjectEstimateInput = (overrides?: Partial<TimeTracking_DeleteProjectEstimateInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_DeleteProjectEstimateInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DeleteProjectEstimateInput');
    return {
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : 'a62654ce-9c08-4a01-886e-6898a61f5837',
    };
};

export const aTimeTracking_DeleteProjectEstimatePayload = (overrides?: Partial<TimeTracking_DeleteProjectEstimatePayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_DeleteProjectEstimatePayload' } & TimeTracking_DeleteProjectEstimatePayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DeleteProjectEstimatePayload');
    return {
        __typename: 'TimeTracking_DeleteProjectEstimatePayload',
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : '930542d8-0d54-4804-98b8-8c96620c40bc',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'laudantium',
    };
};

export const aTimeTracking_DeleteTimeEntryError = (overrides?: Partial<TimeTracking_DeleteTimeEntryError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_DeleteTimeEntryError' } & TimeTracking_DeleteTimeEntryError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DeleteTimeEntryError');
    return {
        __typename: 'TimeTracking_DeleteTimeEntryError',
        detailLocalizationArgs: overrides && overrides.hasOwnProperty('detailLocalizationArgs') ? overrides.detailLocalizationArgs! : ['dolore'],
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'molestiae',
        element: overrides && overrides.hasOwnProperty('element') ? overrides.element! : 'dolorem',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'voluptas',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'quis',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'assumenda',
    };
};

export const aTimeTracking_DeleteTimeEntryInput = (overrides?: Partial<TimeTracking_DeleteTimeEntryInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_DeleteTimeEntryInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DeleteTimeEntryInput');
    return {
        closedBookPassword: overrides && overrides.hasOwnProperty('closedBookPassword') ? overrides.closedBookPassword! : 'enim',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'e9a7edc7-ebae-466d-832a-137c1ed03309',
        isExported: overrides && overrides.hasOwnProperty('isExported') ? overrides.isExported! : false,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'ipsa',
    };
};

export const aTimeTracking_DeleteTimeEntryPayload = (overrides?: Partial<TimeTracking_DeleteTimeEntryPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_DeleteTimeEntryPayload' } & TimeTracking_DeleteTimeEntryPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DeleteTimeEntryPayload');
    return {
        __typename: 'TimeTracking_DeleteTimeEntryPayload',
        deleted: overrides && overrides.hasOwnProperty('deleted') ? overrides.deleted! : '71d46ed6-b185-4b84-9c67-f04a10a70a66',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'est',
    };
};

export const aTimeTracking_DistanceTracking = (overrides?: Partial<TimeTracking_DistanceTracking>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_DistanceTracking' } & TimeTracking_DistanceTracking => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DistanceTracking');
    return {
        __typename: 'TimeTracking_DistanceTracking',
        autoCalculatedMeters: overrides && overrides.hasOwnProperty('autoCalculatedMeters') ? overrides.autoCalculatedMeters! : 297,
        manualMeters: overrides && overrides.hasOwnProperty('manualMeters') ? overrides.manualMeters! : 7122,
    };
};

export const aTimeTracking_DistanceTrackingUpdateInput = (overrides?: Partial<TimeTracking_DistanceTrackingUpdateInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_DistanceTrackingUpdateInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_DistanceTrackingUpdateInput');
    return {
        isAutoCalculated: overrides && overrides.hasOwnProperty('isAutoCalculated') ? overrides.isAutoCalculated! : false,
        manualMeters: overrides && overrides.hasOwnProperty('manualMeters') ? overrides.manualMeters! : 3375,
    };
};

export const aTimeTracking_EffectiveUserSettings = (overrides?: Partial<TimeTracking_EffectiveUserSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_EffectiveUserSettings' } & TimeTracking_EffectiveUserSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_EffectiveUserSettings');
    return {
        __typename: 'TimeTracking_EffectiveUserSettings',
        clockInSetting: overrides && overrides.hasOwnProperty('clockInSetting') ? overrides.clockInSetting! : relationshipsToOmit.has('TimeTracking_ShiftNotificationSettings') ? {} as TimeTracking_ShiftNotificationSettings : aTimeTracking_ShiftNotificationSettings({}, relationshipsToOmit),
        clockOutSetting: overrides && overrides.hasOwnProperty('clockOutSetting') ? overrides.clockOutSetting! : relationshipsToOmit.has('TimeTracking_ShiftNotificationSettings') ? {} as TimeTracking_ShiftNotificationSettings : aTimeTracking_ShiftNotificationSettings({}, relationshipsToOmit),
        notificationEnabledForDays: overrides && overrides.hasOwnProperty('notificationEnabledForDays') ? overrides.notificationEnabledForDays! : relationshipsToOmit.has('TimeTracking_SettingNotificationReminderDays') ? {} as TimeTracking_SettingNotificationReminderDays : aTimeTracking_SettingNotificationReminderDays({}, relationshipsToOmit),
    };
};

export const aTimeTracking_EmployeeApprovalReminder = (overrides?: Partial<TimeTracking_EmployeeApprovalReminder>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_EmployeeApprovalReminder' } & TimeTracking_EmployeeApprovalReminder => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_EmployeeApprovalReminder');
    return {
        __typename: 'TimeTracking_EmployeeApprovalReminder',
        daily: overrides && overrides.hasOwnProperty('daily') ? overrides.daily! : relationshipsToOmit.has('TimeTracking_DailyApprovalReminder') ? {} as TimeTracking_DailyApprovalReminder : aTimeTracking_DailyApprovalReminder({}, relationshipsToOmit),
        payPeriod: overrides && overrides.hasOwnProperty('payPeriod') ? overrides.payPeriod! : relationshipsToOmit.has('TimeTracking_PayPeriodApprovalReminder') ? {} as TimeTracking_PayPeriodApprovalReminder : aTimeTracking_PayPeriodApprovalReminder({}, relationshipsToOmit),
        reminderBasedOn: overrides && overrides.hasOwnProperty('reminderBasedOn') ? overrides.reminderBasedOn! : relationshipsToOmit.has('TimeTracking_ApprovalReminderBasisSetting') ? {} as TimeTracking_ApprovalReminderBasisSetting : aTimeTracking_ApprovalReminderBasisSetting({}, relationshipsToOmit),
        week: overrides && overrides.hasOwnProperty('week') ? overrides.week! : relationshipsToOmit.has('TimeTracking_WeeklyApprovalReminder') ? {} as TimeTracking_WeeklyApprovalReminder : aTimeTracking_WeeklyApprovalReminder({}, relationshipsToOmit),
    };
};

export const aTimeTracking_EmployeeApprovalReminderInput = (overrides?: Partial<TimeTracking_EmployeeApprovalReminderInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_EmployeeApprovalReminderInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_EmployeeApprovalReminderInput');
    return {
        daily: overrides && overrides.hasOwnProperty('daily') ? overrides.daily! : relationshipsToOmit.has('TimeTracking_DailyApprovalReminderInput') ? {} as TimeTracking_DailyApprovalReminderInput : aTimeTracking_DailyApprovalReminderInput({}, relationshipsToOmit),
        payPeriod: overrides && overrides.hasOwnProperty('payPeriod') ? overrides.payPeriod! : relationshipsToOmit.has('TimeTracking_PayPeriodApprovalReminderInput') ? {} as TimeTracking_PayPeriodApprovalReminderInput : aTimeTracking_PayPeriodApprovalReminderInput({}, relationshipsToOmit),
        reminderBasedOn: overrides && overrides.hasOwnProperty('reminderBasedOn') ? overrides.reminderBasedOn! : relationshipsToOmit.has('TimeTracking_UpdateSettingApprovalReminderBasisInput') ? {} as TimeTracking_UpdateSettingApprovalReminderBasisInput : aTimeTracking_UpdateSettingApprovalReminderBasisInput({}, relationshipsToOmit),
        week: overrides && overrides.hasOwnProperty('week') ? overrides.week! : relationshipsToOmit.has('TimeTracking_WeeklyApprovalReminderInput') ? {} as TimeTracking_WeeklyApprovalReminderInput : aTimeTracking_WeeklyApprovalReminderInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_EmployeeApprovalSettings = (overrides?: Partial<TimeTracking_EmployeeApprovalSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_EmployeeApprovalSettings' } & TimeTracking_EmployeeApprovalSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_EmployeeApprovalSettings');
    return {
        __typename: 'TimeTracking_EmployeeApprovalSettings',
        approvalEnabled: overrides && overrides.hasOwnProperty('approvalEnabled') ? overrides.approvalEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        partialWeekApprovalEnabled: overrides && overrides.hasOwnProperty('partialWeekApprovalEnabled') ? overrides.partialWeekApprovalEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        reminders: overrides && overrides.hasOwnProperty('reminders') ? overrides.reminders! : relationshipsToOmit.has('TimeTracking_EmployeeApprovalReminder') ? {} as TimeTracking_EmployeeApprovalReminder : aTimeTracking_EmployeeApprovalReminder({}, relationshipsToOmit),
        submissionRequired: overrides && overrides.hasOwnProperty('submissionRequired') ? overrides.submissionRequired! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        submitMessage: overrides && overrides.hasOwnProperty('submitMessage') ? overrides.submitMessage! : relationshipsToOmit.has('TimeTracking_SettingString') ? {} as TimeTracking_SettingString : aTimeTracking_SettingString({}, relationshipsToOmit),
    };
};

export const aTimeTracking_EmployeeApprovalSettingsInput = (overrides?: Partial<TimeTracking_EmployeeApprovalSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_EmployeeApprovalSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_EmployeeApprovalSettingsInput');
    return {
        approvalEnabled: overrides && overrides.hasOwnProperty('approvalEnabled') ? overrides.approvalEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        partialWeekApprovalEnabled: overrides && overrides.hasOwnProperty('partialWeekApprovalEnabled') ? overrides.partialWeekApprovalEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        reminders: overrides && overrides.hasOwnProperty('reminders') ? overrides.reminders! : relationshipsToOmit.has('TimeTracking_EmployeeApprovalReminderInput') ? {} as TimeTracking_EmployeeApprovalReminderInput : aTimeTracking_EmployeeApprovalReminderInput({}, relationshipsToOmit),
        submissionRequired: overrides && overrides.hasOwnProperty('submissionRequired') ? overrides.submissionRequired! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        submitMessage: overrides && overrides.hasOwnProperty('submitMessage') ? overrides.submitMessage! : relationshipsToOmit.has('TimeTracking_UpdateSettingStringInput') ? {} as TimeTracking_UpdateSettingStringInput : aTimeTracking_UpdateSettingStringInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_EmployeeDailyReminderInputSettings = (overrides?: Partial<TimeTracking_EmployeeDailyReminderInputSettings>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_EmployeeDailyReminderInputSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_EmployeeDailyReminderInputSettings');
    return {
        hour: overrides && overrides.hasOwnProperty('hour') ? overrides.hour! : relationshipsToOmit.has('TimeTracking_UpdateSettingIntegerInput') ? {} as TimeTracking_UpdateSettingIntegerInput : aTimeTracking_UpdateSettingIntegerInput({}, relationshipsToOmit),
        reminderMedium: overrides && overrides.hasOwnProperty('reminderMedium') ? overrides.reminderMedium! : relationshipsToOmit.has('TimeTracking_UpdateSettingApprovalReminderMediumInput') ? {} as TimeTracking_UpdateSettingApprovalReminderMediumInput : aTimeTracking_UpdateSettingApprovalReminderMediumInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_EmployerSettings = (overrides?: Partial<TimeTracking_EmployerSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_EmployerSettings' } & TimeTracking_EmployerSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_EmployerSettings');
    return {
        __typename: 'TimeTracking_EmployerSettings',
        billingForTimeEnabled: overrides && overrides.hasOwnProperty('billingForTimeEnabled') ? overrides.billingForTimeEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        billingRateForTimeEnabled: overrides && overrides.hasOwnProperty('billingRateForTimeEnabled') ? overrides.billingRateForTimeEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        clockRoundingSettings: overrides && overrides.hasOwnProperty('clockRoundingSettings') ? overrides.clockRoundingSettings! : relationshipsToOmit.has('TimeTracking_TimesheetRoundingEmployerSettings') ? {} as TimeTracking_TimesheetRoundingEmployerSettings : aTimeTracking_TimesheetRoundingEmployerSettings({}, relationshipsToOmit),
        coreSettings: overrides && overrides.hasOwnProperty('coreSettings') ? overrides.coreSettings! : relationshipsToOmit.has('TimeTracking_CoreEmployerSettings') ? {} as TimeTracking_CoreEmployerSettings : aTimeTracking_CoreEmployerSettings({}, relationshipsToOmit),
        dateTimeSettings: overrides && overrides.hasOwnProperty('dateTimeSettings') ? overrides.dateTimeSettings! : relationshipsToOmit.has('TimeTracking_TimeAndDateEmployerSettings') ? {} as TimeTracking_TimeAndDateEmployerSettings : aTimeTracking_TimeAndDateEmployerSettings({}, relationshipsToOmit),
        geofenceSettings: overrides && overrides.hasOwnProperty('geofenceSettings') ? overrides.geofenceSettings! : relationshipsToOmit.has('TimeTracking_GeofenceEmployerSettings') ? {} as TimeTracking_GeofenceEmployerSettings : aTimeTracking_GeofenceEmployerSettings({}, relationshipsToOmit),
        kioskSettings: overrides && overrides.hasOwnProperty('kioskSettings') ? overrides.kioskSettings! : relationshipsToOmit.has('TimeTracking_KioskEmployerSettings') ? {} as TimeTracking_KioskEmployerSettings : aTimeTracking_KioskEmployerSettings({}, relationshipsToOmit),
        notificationSettings: overrides && overrides.hasOwnProperty('notificationSettings') ? overrides.notificationSettings! : relationshipsToOmit.has('TimeTracking_NotificationEmployerSettings') ? {} as TimeTracking_NotificationEmployerSettings : aTimeTracking_NotificationEmployerSettings({}, relationshipsToOmit),
        scheduleSettings: overrides && overrides.hasOwnProperty('scheduleSettings') ? overrides.scheduleSettings! : relationshipsToOmit.has('TimeTracking_ScheduleEmployerSettings') ? {} as TimeTracking_ScheduleEmployerSettings : aTimeTracking_ScheduleEmployerSettings({}, relationshipsToOmit),
        startWorkWeek: overrides && overrides.hasOwnProperty('startWorkWeek') ? overrides.startWorkWeek! : relationshipsToOmit.has('TimeTracking_SettingDaysOfWeek') ? {} as TimeTracking_SettingDaysOfWeek : aTimeTracking_SettingDaysOfWeek({}, relationshipsToOmit),
        timeTrackingEnabled: overrides && overrides.hasOwnProperty('timeTrackingEnabled') ? overrides.timeTrackingEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        timeTrackingSupported: overrides && overrides.hasOwnProperty('timeTrackingSupported') ? overrides.timeTrackingSupported! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        timesheetManagementSettings: overrides && overrides.hasOwnProperty('timesheetManagementSettings') ? overrides.timesheetManagementSettings! : relationshipsToOmit.has('TimeTracking_TimesheetManagementEmployerSettings') ? {} as TimeTracking_TimesheetManagementEmployerSettings : aTimeTracking_TimesheetManagementEmployerSettings({}, relationshipsToOmit),
        transactionBillingForTimeEnabled: overrides && overrides.hasOwnProperty('transactionBillingForTimeEnabled') ? overrides.transactionBillingForTimeEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        transactionTimeTrackingEnabled: overrides && overrides.hasOwnProperty('transactionTimeTrackingEnabled') ? overrides.transactionTimeTrackingEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        useItemForTime: overrides && overrides.hasOwnProperty('useItemForTime') ? overrides.useItemForTime! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
    };
};

export const aTimeTracking_EmployerSettingsInput = (overrides?: Partial<TimeTracking_EmployerSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_EmployerSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_EmployerSettingsInput');
    return {
        isExported: overrides && overrides.hasOwnProperty('isExported') ? overrides.isExported! : false,
    };
};

export const aTimeTracking_FeaturePermissions = (overrides?: Partial<TimeTracking_FeaturePermissions>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_FeaturePermissions' } & TimeTracking_FeaturePermissions => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_FeaturePermissions');
    return {
        __typename: 'TimeTracking_FeaturePermissions',
        externalAccessEnabled: overrides && overrides.hasOwnProperty('externalAccessEnabled') ? overrides.externalAccessEnabled! : false,
        mobileEnabled: overrides && overrides.hasOwnProperty('mobileEnabled') ? overrides.mobileEnabled! : false,
        pinLoginEnabled: overrides && overrides.hasOwnProperty('pinLoginEnabled') ? overrides.pinLoginEnabled! : true,
        whosWorkingEnabled: overrides && overrides.hasOwnProperty('whosWorkingEnabled') ? overrides.whosWorkingEnabled! : false,
    };
};

export const aTimeTracking_FeaturePermissionsInput = (overrides?: Partial<TimeTracking_FeaturePermissionsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_FeaturePermissionsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_FeaturePermissionsInput');
    return {
        externalAccessEnabled: overrides && overrides.hasOwnProperty('externalAccessEnabled') ? overrides.externalAccessEnabled! : false,
        mobileEnabled: overrides && overrides.hasOwnProperty('mobileEnabled') ? overrides.mobileEnabled! : false,
        pinLoginEnabled: overrides && overrides.hasOwnProperty('pinLoginEnabled') ? overrides.pinLoginEnabled! : false,
        whosWorkingEnabled: overrides && overrides.hasOwnProperty('whosWorkingEnabled') ? overrides.whosWorkingEnabled! : true,
    };
};

export const aTimeTracking_FieldOptionEstimate = (overrides?: Partial<TimeTracking_FieldOptionEstimate>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_FieldOptionEstimate' } & TimeTracking_FieldOptionEstimate => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_FieldOptionEstimate');
    return {
        __typename: 'TimeTracking_FieldOptionEstimate',
        elapsedSeconds: overrides && overrides.hasOwnProperty('elapsedSeconds') ? overrides.elapsedSeconds! : 'quod',
        estimatedSeconds: overrides && overrides.hasOwnProperty('estimatedSeconds') ? overrides.estimatedSeconds! : 'error',
        fieldOptionId: overrides && overrides.hasOwnProperty('fieldOptionId') ? overrides.fieldOptionId! : '6df5b693-588a-424e-9242-4a52dac76556',
        serviceItemDAS: overrides && overrides.hasOwnProperty('serviceItemDAS') ? overrides.serviceItemDAS! : relationshipsToOmit.has('DataAccess_Product') ? {} as DataAccess_Product : aDataAccess_Product({}, relationshipsToOmit),
    };
};

export const aTimeTracking_FieldOptionEstimateInput = (overrides?: Partial<TimeTracking_FieldOptionEstimateInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_FieldOptionEstimateInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_FieldOptionEstimateInput');
    return {
        estimatedSeconds: overrides && overrides.hasOwnProperty('estimatedSeconds') ? overrides.estimatedSeconds! : 'voluptas',
        fieldOptionId: overrides && overrides.hasOwnProperty('fieldOptionId') ? overrides.fieldOptionId! : '4b95c682-ed5b-43c9-ab8a-b5af88fb7511',
    };
};

export const aTimeTracking_FieldOptionEstimatesConnection = (overrides?: Partial<TimeTracking_FieldOptionEstimatesConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_FieldOptionEstimatesConnection' } & TimeTracking_FieldOptionEstimatesConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_FieldOptionEstimatesConnection');
    return {
        __typename: 'TimeTracking_FieldOptionEstimatesConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_FieldOptionEstimatesEdge') ? {} as TimeTracking_FieldOptionEstimatesEdge : aTimeTracking_FieldOptionEstimatesEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_FieldOptionEstimatesEdge = (overrides?: Partial<TimeTracking_FieldOptionEstimatesEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_FieldOptionEstimatesEdge' } & TimeTracking_FieldOptionEstimatesEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_FieldOptionEstimatesEdge');
    return {
        __typename: 'TimeTracking_FieldOptionEstimatesEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'quis',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_FieldOptionEstimate') ? {} as TimeTracking_FieldOptionEstimate : aTimeTracking_FieldOptionEstimate({}, relationshipsToOmit),
    };
};

export const aTimeTracking_Flag = (overrides?: Partial<TimeTracking_Flag>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_Flag' } & TimeTracking_Flag => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_Flag');
    return {
        __typename: 'TimeTracking_Flag',
        flagTime: overrides && overrides.hasOwnProperty('flagTime') ? overrides.flagTime! : 'est',
        flagType: overrides && overrides.hasOwnProperty('flagType') ? overrides.flagType! : TimeTracking_FlagType.BatterySaverEnabled,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'ae76f810-0a65-4e4d-b24f-c6adf1467b47',
        note: overrides && overrides.hasOwnProperty('note') ? overrides.note! : 'recusandae',
        timeForContactDAS: overrides && overrides.hasOwnProperty('timeForContactDAS') ? overrides.timeForContactDAS! : relationshipsToOmit.has('DataAccess_Contact') ? {} as DataAccess_Contact : aDataAccess_Contact({}, relationshipsToOmit),
        timeForType: overrides && overrides.hasOwnProperty('timeForType') ? overrides.timeForType! : TimeTracking_TimeForType.Employee,
    };
};

export const aTimeTracking_FlagEntityInput = (overrides?: Partial<TimeTracking_FlagEntityInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_FlagEntityInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_FlagEntityInput');
    return {
        entityId: overrides && overrides.hasOwnProperty('entityId') ? overrides.entityId! : '2510c75a-89f4-416a-89f3-dcb35a524227',
        entityType: overrides && overrides.hasOwnProperty('entityType') ? overrides.entityType! : TimeTracking_FlagEntityType.LocationPoint,
    };
};

export const aTimeTracking_FlagError = (overrides?: Partial<TimeTracking_FlagError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_FlagError' } & TimeTracking_FlagError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_FlagError');
    return {
        __typename: 'TimeTracking_FlagError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'et',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'et',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'eius',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'laborum',
    };
};

export const aTimeTracking_FlagMap = (overrides?: Partial<TimeTracking_FlagMap>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_FlagMap' } & TimeTracking_FlagMap => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_FlagMap');
    return {
        __typename: 'TimeTracking_FlagMap',
        entityId: overrides && overrides.hasOwnProperty('entityId') ? overrides.entityId! : '520ad4ad-a3b6-46a2-bc2f-9f3cb1d946a7',
        entityType: overrides && overrides.hasOwnProperty('entityType') ? overrides.entityType! : TimeTracking_FlagEntityType.LocationPoint,
        flagId: overrides && overrides.hasOwnProperty('flagId') ? overrides.flagId! : '8ce3275c-523e-4fbf-8c2b-12c228e1a110',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'b8717fbf-6b2e-4c8e-9d8c-36f0b478d0b2',
        isActive: overrides && overrides.hasOwnProperty('isActive') ? overrides.isActive! : false,
        timeForContactDAS: overrides && overrides.hasOwnProperty('timeForContactDAS') ? overrides.timeForContactDAS! : relationshipsToOmit.has('DataAccess_Contact') ? {} as DataAccess_Contact : aDataAccess_Contact({}, relationshipsToOmit),
        timeForType: overrides && overrides.hasOwnProperty('timeForType') ? overrides.timeForType! : TimeTracking_TimeForType.Employee,
    };
};

export const aTimeTracking_GeofenceConfiguration = (overrides?: Partial<TimeTracking_GeofenceConfiguration>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GeofenceConfiguration' } & TimeTracking_GeofenceConfiguration => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GeofenceConfiguration');
    return {
        __typename: 'TimeTracking_GeofenceConfiguration',
        geofenceEnabled: overrides && overrides.hasOwnProperty('geofenceEnabled') ? overrides.geofenceEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        geofenceLocation: overrides && overrides.hasOwnProperty('geofenceLocation') ? overrides.geofenceLocation! : relationshipsToOmit.has('TimeTracking_GeofenceLocation') ? {} as TimeTracking_GeofenceLocation : aTimeTracking_GeofenceLocation({}, relationshipsToOmit),
        timeAgainstContactDAS: overrides && overrides.hasOwnProperty('timeAgainstContactDAS') ? overrides.timeAgainstContactDAS! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainstContact') ? {} as TimeTracking_TrackTimeAgainstContact : aTimeTracking_TrackTimeAgainstContact({}, relationshipsToOmit),
    };
};

export const aTimeTracking_GeofenceConfigurationConnection = (overrides?: Partial<TimeTracking_GeofenceConfigurationConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GeofenceConfigurationConnection' } & TimeTracking_GeofenceConfigurationConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GeofenceConfigurationConnection');
    return {
        __typename: 'TimeTracking_GeofenceConfigurationConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_GeofenceConfigurationEdge') ? {} as TimeTracking_GeofenceConfigurationEdge : aTimeTracking_GeofenceConfigurationEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_GeofenceConfigurationEdge = (overrides?: Partial<TimeTracking_GeofenceConfigurationEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GeofenceConfigurationEdge' } & TimeTracking_GeofenceConfigurationEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GeofenceConfigurationEdge');
    return {
        __typename: 'TimeTracking_GeofenceConfigurationEdge',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_GeofenceConfiguration') ? {} as TimeTracking_GeofenceConfiguration : aTimeTracking_GeofenceConfiguration({}, relationshipsToOmit),
    };
};

export const aTimeTracking_GeofenceConfigurationInput = (overrides?: Partial<TimeTracking_GeofenceConfigurationInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_GeofenceConfigurationInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GeofenceConfigurationInput');
    return {
        timeAgainstList: overrides && overrides.hasOwnProperty('timeAgainstList') ? overrides.timeAgainstList! : [relationshipsToOmit.has('TimeTracking_TrackTimeAgainstInput') ? {} as TimeTracking_TrackTimeAgainstInput : aTimeTracking_TrackTimeAgainstInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_GeofenceEmployerSettings = (overrides?: Partial<TimeTracking_GeofenceEmployerSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GeofenceEmployerSettings' } & TimeTracking_GeofenceEmployerSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GeofenceEmployerSettings');
    return {
        __typename: 'TimeTracking_GeofenceEmployerSettings',
        geofenceEnabled: overrides && overrides.hasOwnProperty('geofenceEnabled') ? overrides.geofenceEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        geofenceReminderSettings: overrides && overrides.hasOwnProperty('geofenceReminderSettings') ? overrides.geofenceReminderSettings! : relationshipsToOmit.has('TimeTracking_GeofenceReminderSettings') ? {} as TimeTracking_GeofenceReminderSettings : aTimeTracking_GeofenceReminderSettings({}, relationshipsToOmit),
    };
};

export const aTimeTracking_GeofenceEmployerSettingsInput = (overrides?: Partial<TimeTracking_GeofenceEmployerSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_GeofenceEmployerSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GeofenceEmployerSettingsInput');
    return {
        geofenceEnabled: overrides && overrides.hasOwnProperty('geofenceEnabled') ? overrides.geofenceEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        geofenceReminderSettings: overrides && overrides.hasOwnProperty('geofenceReminderSettings') ? overrides.geofenceReminderSettings! : relationshipsToOmit.has('TimeTracking_UpdateGeofenceReminderSettingsInput') ? {} as TimeTracking_UpdateGeofenceReminderSettingsInput : aTimeTracking_UpdateGeofenceReminderSettingsInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_GeofenceLocation = (overrides?: Partial<TimeTracking_GeofenceLocation>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GeofenceLocation' } & TimeTracking_GeofenceLocation => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GeofenceLocation');
    return {
        __typename: 'TimeTracking_GeofenceLocation',
        geofenceRadiusInMeter: overrides && overrides.hasOwnProperty('geofenceRadiusInMeter') ? overrides.geofenceRadiusInMeter! : 5879,
        latitude: overrides && overrides.hasOwnProperty('latitude') ? overrides.latitude! : 'aut',
        longitude: overrides && overrides.hasOwnProperty('longitude') ? overrides.longitude! : 'repellendus',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
    };
};

export const aTimeTracking_GeofenceRadiusInput = (overrides?: Partial<TimeTracking_GeofenceRadiusInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_GeofenceRadiusInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GeofenceRadiusInput');
    return {
        placeId: overrides && overrides.hasOwnProperty('placeId') ? overrides.placeId! : 'nulla',
    };
};

export const aTimeTracking_GeofenceRadiusResult = (overrides?: Partial<TimeTracking_GeofenceRadiusResult>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GeofenceRadiusResult' } & TimeTracking_GeofenceRadiusResult => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GeofenceRadiusResult');
    return {
        __typename: 'TimeTracking_GeofenceRadiusResult',
        geofenceRadiusInMeter: overrides && overrides.hasOwnProperty('geofenceRadiusInMeter') ? overrides.geofenceRadiusInMeter! : 5124,
        placeId: overrides && overrides.hasOwnProperty('placeId') ? overrides.placeId! : 'amet',
    };
};

export const aTimeTracking_GeofenceReminderDaysOfWeek = (overrides?: Partial<TimeTracking_GeofenceReminderDaysOfWeek>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GeofenceReminderDaysOfWeek' } & TimeTracking_GeofenceReminderDaysOfWeek => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GeofenceReminderDaysOfWeek');
    return {
        __typename: 'TimeTracking_GeofenceReminderDaysOfWeek',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : [Common_DayOfWeek.Friday],
    };
};

export const aTimeTracking_GeofenceReminderDaysOfWeekInput = (overrides?: Partial<TimeTracking_GeofenceReminderDaysOfWeekInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_GeofenceReminderDaysOfWeekInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GeofenceReminderDaysOfWeekInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : [Common_DayOfWeek.Friday],
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'accusamus',
    };
};

export const aTimeTracking_GeofenceReminderSettings = (overrides?: Partial<TimeTracking_GeofenceReminderSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GeofenceReminderSettings' } & TimeTracking_GeofenceReminderSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GeofenceReminderSettings');
    return {
        __typename: 'TimeTracking_GeofenceReminderSettings',
        daysOfWeek: overrides && overrides.hasOwnProperty('daysOfWeek') ? overrides.daysOfWeek! : relationshipsToOmit.has('TimeTracking_GeofenceReminderDaysOfWeek') ? {} as TimeTracking_GeofenceReminderDaysOfWeek : aTimeTracking_GeofenceReminderDaysOfWeek({}, relationshipsToOmit),
        endTime: overrides && overrides.hasOwnProperty('endTime') ? overrides.endTime! : relationshipsToOmit.has('TimeTracking_SettingString') ? {} as TimeTracking_SettingString : aTimeTracking_SettingString({}, relationshipsToOmit),
        startTime: overrides && overrides.hasOwnProperty('startTime') ? overrides.startTime! : relationshipsToOmit.has('TimeTracking_SettingString') ? {} as TimeTracking_SettingString : aTimeTracking_SettingString({}, relationshipsToOmit),
    };
};

export const aTimeTracking_Group = (overrides?: Partial<TimeTracking_Group>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_Group' } & TimeTracking_Group => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_Group');
    return {
        __typename: 'TimeTracking_Group',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '5efcc1d3-7beb-4e87-8aae-05bb2ac560a5',
        isActive: overrides && overrides.hasOwnProperty('isActive') ? overrides.isActive! : true,
        managers: overrides && overrides.hasOwnProperty('managers') ? overrides.managers! : relationshipsToOmit.has('TimeTracking_WorkerConnection') ? {} as TimeTracking_WorkerConnection : aTimeTracking_WorkerConnection({}, relationshipsToOmit),
        members: overrides && overrides.hasOwnProperty('members') ? overrides.members! : relationshipsToOmit.has('TimeTracking_WorkerConnection') ? {} as TimeTracking_WorkerConnection : aTimeTracking_WorkerConnection({}, relationshipsToOmit),
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_GroupMeta') ? {} as TimeTracking_GroupMeta : aTimeTracking_GroupMeta({}, relationshipsToOmit),
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'eveniet',
        stats: overrides && overrides.hasOwnProperty('stats') ? overrides.stats! : relationshipsToOmit.has('TimeTracking_GroupStats') ? {} as TimeTracking_GroupStats : aTimeTracking_GroupStats({}, relationshipsToOmit),
    };
};

export const aTimeTracking_GroupConnection = (overrides?: Partial<TimeTracking_GroupConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GroupConnection' } & TimeTracking_GroupConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GroupConnection');
    return {
        __typename: 'TimeTracking_GroupConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_GroupEdge') ? {} as TimeTracking_GroupEdge : aTimeTracking_GroupEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
        totalActiveGroupCount: overrides && overrides.hasOwnProperty('totalActiveGroupCount') ? overrides.totalActiveGroupCount! : 1210,
        totalCount: overrides && overrides.hasOwnProperty('totalCount') ? overrides.totalCount! : 3264,
        totalTimeAgainstCount: overrides && overrides.hasOwnProperty('totalTimeAgainstCount') ? overrides.totalTimeAgainstCount! : 9556,
    };
};

export const aTimeTracking_GroupEdge = (overrides?: Partial<TimeTracking_GroupEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GroupEdge' } & TimeTracking_GroupEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GroupEdge');
    return {
        __typename: 'TimeTracking_GroupEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'perspiciatis',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_Group') ? {} as TimeTracking_Group : aTimeTracking_Group({}, relationshipsToOmit),
    };
};

export const aTimeTracking_GroupFilter = (overrides?: Partial<TimeTracking_GroupFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_GroupFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GroupFilter');
    return {
        ids: overrides && overrides.hasOwnProperty('ids') ? overrides.ids! : ['9eac954b-a7bd-4ef7-8626-464ddfe9a7f6'],
        isActive: overrides && overrides.hasOwnProperty('isActive') ? overrides.isActive! : true,
        searchText: overrides && overrides.hasOwnProperty('searchText') ? overrides.searchText! : 'et',
    };
};

export const aTimeTracking_GroupManagerAssignmentError = (overrides?: Partial<TimeTracking_GroupManagerAssignmentError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GroupManagerAssignmentError' } & TimeTracking_GroupManagerAssignmentError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GroupManagerAssignmentError');
    return {
        __typename: 'TimeTracking_GroupManagerAssignmentError',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'sunt',
        errorMessage: overrides && overrides.hasOwnProperty('errorMessage') ? overrides.errorMessage! : 'reprehenderit',
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : '88ec3d39-dfcd-45fe-b022-3125cfbc1549',
    };
};

export const aTimeTracking_GroupManagerAssignmentSuccess = (overrides?: Partial<TimeTracking_GroupManagerAssignmentSuccess>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GroupManagerAssignmentSuccess' } & TimeTracking_GroupManagerAssignmentSuccess => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GroupManagerAssignmentSuccess');
    return {
        __typename: 'TimeTracking_GroupManagerAssignmentSuccess',
        worker: overrides && overrides.hasOwnProperty('worker') ? overrides.worker! : relationshipsToOmit.has('TimeTracking_Worker') ? {} as TimeTracking_Worker : aTimeTracking_Worker({}, relationshipsToOmit),
    };
};

export const aTimeTracking_GroupManagerRemovalError = (overrides?: Partial<TimeTracking_GroupManagerRemovalError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GroupManagerRemovalError' } & TimeTracking_GroupManagerRemovalError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GroupManagerRemovalError');
    return {
        __typename: 'TimeTracking_GroupManagerRemovalError',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'sed',
        errorMessage: overrides && overrides.hasOwnProperty('errorMessage') ? overrides.errorMessage! : 'officia',
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : '635a5a22-954a-435a-b0a6-fc47840c102f',
    };
};

export const aTimeTracking_GroupManagerRemovalSuccess = (overrides?: Partial<TimeTracking_GroupManagerRemovalSuccess>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GroupManagerRemovalSuccess' } & TimeTracking_GroupManagerRemovalSuccess => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GroupManagerRemovalSuccess');
    return {
        __typename: 'TimeTracking_GroupManagerRemovalSuccess',
        worker: overrides && overrides.hasOwnProperty('worker') ? overrides.worker! : relationshipsToOmit.has('TimeTracking_Worker') ? {} as TimeTracking_Worker : aTimeTracking_Worker({}, relationshipsToOmit),
    };
};

export const aTimeTracking_GroupMemberAssignmentError = (overrides?: Partial<TimeTracking_GroupMemberAssignmentError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GroupMemberAssignmentError' } & TimeTracking_GroupMemberAssignmentError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GroupMemberAssignmentError');
    return {
        __typename: 'TimeTracking_GroupMemberAssignmentError',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'voluptate',
        errorMessage: overrides && overrides.hasOwnProperty('errorMessage') ? overrides.errorMessage! : 'iusto',
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : 'c4d7bac1-5052-4d9e-b5f2-7b1e1f72c727',
    };
};

export const aTimeTracking_GroupMemberAssignmentSuccess = (overrides?: Partial<TimeTracking_GroupMemberAssignmentSuccess>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GroupMemberAssignmentSuccess' } & TimeTracking_GroupMemberAssignmentSuccess => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GroupMemberAssignmentSuccess');
    return {
        __typename: 'TimeTracking_GroupMemberAssignmentSuccess',
        worker: overrides && overrides.hasOwnProperty('worker') ? overrides.worker! : relationshipsToOmit.has('TimeTracking_Worker') ? {} as TimeTracking_Worker : aTimeTracking_Worker({}, relationshipsToOmit),
    };
};

export const aTimeTracking_GroupMemberRemovalError = (overrides?: Partial<TimeTracking_GroupMemberRemovalError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GroupMemberRemovalError' } & TimeTracking_GroupMemberRemovalError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GroupMemberRemovalError');
    return {
        __typename: 'TimeTracking_GroupMemberRemovalError',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'non',
        errorMessage: overrides && overrides.hasOwnProperty('errorMessage') ? overrides.errorMessage! : 'dicta',
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : '41beca97-a989-43ef-ac5d-e28ec1c76d28',
    };
};

export const aTimeTracking_GroupMemberRemovalSuccess = (overrides?: Partial<TimeTracking_GroupMemberRemovalSuccess>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GroupMemberRemovalSuccess' } & TimeTracking_GroupMemberRemovalSuccess => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GroupMemberRemovalSuccess');
    return {
        __typename: 'TimeTracking_GroupMemberRemovalSuccess',
        worker: overrides && overrides.hasOwnProperty('worker') ? overrides.worker! : relationshipsToOmit.has('TimeTracking_Worker') ? {} as TimeTracking_Worker : aTimeTracking_Worker({}, relationshipsToOmit),
    };
};

export const aTimeTracking_GroupMeta = (overrides?: Partial<TimeTracking_GroupMeta>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GroupMeta' } & TimeTracking_GroupMeta => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GroupMeta');
    return {
        __typename: 'TimeTracking_GroupMeta',
        createdAt: overrides && overrides.hasOwnProperty('createdAt') ? overrides.createdAt! : 'perspiciatis',
        createdBy: overrides && overrides.hasOwnProperty('createdBy') ? overrides.createdBy! : 'maiores',
        updatedAt: overrides && overrides.hasOwnProperty('updatedAt') ? overrides.updatedAt! : 'quia',
        updatedBy: overrides && overrides.hasOwnProperty('updatedBy') ? overrides.updatedBy! : 'ea',
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 4533,
    };
};

export const aTimeTracking_GroupProfile = (overrides?: Partial<TimeTracking_GroupProfile>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GroupProfile' } & TimeTracking_GroupProfile => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GroupProfile');
    return {
        __typename: 'TimeTracking_GroupProfile',
        groupId: overrides && overrides.hasOwnProperty('groupId') ? overrides.groupId! : 'f361cfe9-c74f-48e2-8698-56b3f6e1134d',
        groupName: overrides && overrides.hasOwnProperty('groupName') ? overrides.groupName! : 'tempora',
    };
};

export const aTimeTracking_GroupStats = (overrides?: Partial<TimeTracking_GroupStats>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_GroupStats' } & TimeTracking_GroupStats => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_GroupStats');
    return {
        __typename: 'TimeTracking_GroupStats',
        assignedTimeAgainstCount: overrides && overrides.hasOwnProperty('assignedTimeAgainstCount') ? overrides.assignedTimeAgainstCount! : 675,
        managerCount: overrides && overrides.hasOwnProperty('managerCount') ? overrides.managerCount! : 1070,
        memberCount: overrides && overrides.hasOwnProperty('memberCount') ? overrides.memberCount! : 1752,
    };
};

export const aTimeTracking_KioskEmployerSettings = (overrides?: Partial<TimeTracking_KioskEmployerSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_KioskEmployerSettings' } & TimeTracking_KioskEmployerSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_KioskEmployerSettings');
    return {
        __typename: 'TimeTracking_KioskEmployerSettings',
        inactivityTimeout: overrides && overrides.hasOwnProperty('inactivityTimeout') ? overrides.inactivityTimeout! : relationshipsToOmit.has('TimeTracking_SettingInteger') ? {} as TimeTracking_SettingInteger : aTimeTracking_SettingInteger({}, relationshipsToOmit),
    };
};

export const aTimeTracking_KioskEmployerSettingsInput = (overrides?: Partial<TimeTracking_KioskEmployerSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_KioskEmployerSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_KioskEmployerSettingsInput');
    return {
        inactivityTimeout: overrides && overrides.hasOwnProperty('inactivityTimeout') ? overrides.inactivityTimeout! : relationshipsToOmit.has('TimeTracking_UpdateSettingIntegerInput') ? {} as TimeTracking_UpdateSettingIntegerInput : aTimeTracking_UpdateSettingIntegerInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_LegacyQboUser = (overrides?: Partial<TimeTracking_LegacyQboUser>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_LegacyQboUser' } & TimeTracking_LegacyQboUser => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_LegacyQboUser');
    return {
        __typename: 'TimeTracking_LegacyQboUser',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'ff7b555b-c745-40ab-a6ba-4fa1858cdf0b',
        legacyId: overrides && overrides.hasOwnProperty('legacyId') ? overrides.legacyId! : 'fc2dee5d-de1b-44b4-a0ac-122fb18b9c9c',
    };
};

export const aTimeTracking_LocationDetail = (overrides?: Partial<TimeTracking_LocationDetail>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_LocationDetail' } & TimeTracking_LocationDetail => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_LocationDetail');
    return {
        __typename: 'TimeTracking_LocationDetail',
        locationDetail: overrides && overrides.hasOwnProperty('locationDetail') ? overrides.locationDetail! : relationshipsToOmit.has('TimeTracking_LocationDetailConnection') ? {} as TimeTracking_LocationDetailConnection : aTimeTracking_LocationDetailConnection({}, relationshipsToOmit),
        timeEntry: overrides && overrides.hasOwnProperty('timeEntry') ? overrides.timeEntry! : relationshipsToOmit.has('TimeTracking_TimeEntry') ? {} as TimeTracking_TimeEntry : aTimeTracking_TimeEntry({}, relationshipsToOmit),
    };
};

export const aTimeTracking_LocationDetailConnection = (overrides?: Partial<TimeTracking_LocationDetailConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_LocationDetailConnection' } & TimeTracking_LocationDetailConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_LocationDetailConnection');
    return {
        __typename: 'TimeTracking_LocationDetailConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_LocationDetailEdge') ? {} as TimeTracking_LocationDetailEdge : aTimeTracking_LocationDetailEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_LocationDetailEdge = (overrides?: Partial<TimeTracking_LocationDetailEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_LocationDetailEdge' } & TimeTracking_LocationDetailEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_LocationDetailEdge');
    return {
        __typename: 'TimeTracking_LocationDetailEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'qui',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_LocationPoint') ? {} as TimeTracking_LocationPoint : aTimeTracking_LocationPoint({}, relationshipsToOmit),
    };
};

export const aTimeTracking_LocationDetailsInput = (overrides?: Partial<TimeTracking_LocationDetailsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_LocationDetailsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_LocationDetailsInput');
    return {
        timeEntryId: overrides && overrides.hasOwnProperty('timeEntryId') ? overrides.timeEntryId! : '5c33dc62-bbf6-45a6-a671-3450466f5687',
    };
};

export const aTimeTracking_LocationMetaData = (overrides?: Partial<TimeTracking_LocationMetaData>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_LocationMetaData' } & TimeTracking_LocationMetaData => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_LocationMetaData');
    return {
        __typename: 'TimeTracking_LocationMetaData',
        createdAt: overrides && overrides.hasOwnProperty('createdAt') ? overrides.createdAt! : 'aperiam',
        createdBy: overrides && overrides.hasOwnProperty('createdBy') ? overrides.createdBy! : 'eos',
    };
};

export const aTimeTracking_LocationPoint = (overrides?: Partial<TimeTracking_LocationPoint>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_LocationPoint' } & TimeTracking_LocationPoint => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_LocationPoint');
    return {
        __typename: 'TimeTracking_LocationPoint',
        accuracy: overrides && overrides.hasOwnProperty('accuracy') ? overrides.accuracy! : 'nobis',
        altitude: overrides && overrides.hasOwnProperty('altitude') ? overrides.altitude! : 'quia',
        confidence: overrides && overrides.hasOwnProperty('confidence') ? overrides.confidence! : 'et',
        createdAt: overrides && overrides.hasOwnProperty('createdAt') ? overrides.createdAt! : 'nihil',
        deviceAttributes: overrides && overrides.hasOwnProperty('deviceAttributes') ? overrides.deviceAttributes! : relationshipsToOmit.has('TimeTracking_TimeEntryDeviceAttributes') ? {} as TimeTracking_TimeEntryDeviceAttributes : aTimeTracking_TimeEntryDeviceAttributes({}, relationshipsToOmit),
        deviceIdentifier: overrides && overrides.hasOwnProperty('deviceIdentifier') ? overrides.deviceIdentifier! : 'minus',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '87f4b91b-c928-4a87-89f1-8d46e9f2592e',
        latitude: overrides && overrides.hasOwnProperty('latitude') ? overrides.latitude! : 'dicta',
        longitude: overrides && overrides.hasOwnProperty('longitude') ? overrides.longitude! : 'maxime',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_LocationMetaData') ? {} as TimeTracking_LocationMetaData : aTimeTracking_LocationMetaData({}, relationshipsToOmit),
        source: overrides && overrides.hasOwnProperty('source') ? overrides.source! : 'quibusdam',
        speed: overrides && overrides.hasOwnProperty('speed') ? overrides.speed! : 'aut',
    };
};

export const aTimeTracking_ManageCustomFieldAssignmentError = (overrides?: Partial<TimeTracking_ManageCustomFieldAssignmentError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageCustomFieldAssignmentError' } & TimeTracking_ManageCustomFieldAssignmentError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageCustomFieldAssignmentError');
    return {
        __typename: 'TimeTracking_ManageCustomFieldAssignmentError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'sunt',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'inventore',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'nihil',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'odio',
    };
};

export const aTimeTracking_ManageCustomFieldAssignmentInput = (overrides?: Partial<TimeTracking_ManageCustomFieldAssignmentInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManageCustomFieldAssignmentInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageCustomFieldAssignmentInput');
    return {
        assignToAll: overrides && overrides.hasOwnProperty('assignToAll') ? overrides.assignToAll! : false,
        customFieldId: overrides && overrides.hasOwnProperty('customFieldId') ? overrides.customFieldId! : '1a821348-a18d-4c0f-a1ef-8c602afa5171',
        timeAgainstAssignments: overrides && overrides.hasOwnProperty('timeAgainstAssignments') ? overrides.timeAgainstAssignments! : relationshipsToOmit.has('TimeTracking_TimeAgainstAssignmentsInput') ? {} as TimeTracking_TimeAgainstAssignmentsInput : aTimeTracking_TimeAgainstAssignmentsInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ManageCustomFieldAssignmentPayload = (overrides?: Partial<TimeTracking_ManageCustomFieldAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageCustomFieldAssignmentPayload' } & TimeTracking_ManageCustomFieldAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageCustomFieldAssignmentPayload');
    return {
        __typename: 'TimeTracking_ManageCustomFieldAssignmentPayload',
        assignToAll: overrides && overrides.hasOwnProperty('assignToAll') ? overrides.assignToAll! : true,
        assignedCustomers: overrides && overrides.hasOwnProperty('assignedCustomers') ? overrides.assignedCustomers! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
        customField: overrides && overrides.hasOwnProperty('customField') ? overrides.customField! : relationshipsToOmit.has('AppFoundations_CustomFieldDefinition') ? {} as AppFoundations_CustomFieldDefinition : anAppFoundations_CustomFieldDefinition({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'ea',
        unassignedCustomers: overrides && overrides.hasOwnProperty('unassignedCustomers') ? overrides.unassignedCustomers! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_ManageCustomFieldInput = (overrides?: Partial<TimeTracking_ManageCustomFieldInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManageCustomFieldInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageCustomFieldInput');
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '480ddf9e-3604-466f-8ec3-19b9078eceaf',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'sunt',
        required: overrides && overrides.hasOwnProperty('required') ? overrides.required! : true,
    };
};

export const aTimeTracking_ManageCustomFieldOptionAssignmentError = (overrides?: Partial<TimeTracking_ManageCustomFieldOptionAssignmentError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageCustomFieldOptionAssignmentError' } & TimeTracking_ManageCustomFieldOptionAssignmentError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageCustomFieldOptionAssignmentError');
    return {
        __typename: 'TimeTracking_ManageCustomFieldOptionAssignmentError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'enim',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'aut',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'pariatur',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'voluptatum',
    };
};

export const aTimeTracking_ManageCustomFieldOptionAssignmentInput = (overrides?: Partial<TimeTracking_ManageCustomFieldOptionAssignmentInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManageCustomFieldOptionAssignmentInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageCustomFieldOptionAssignmentInput');
    return {
        assignToAll: overrides && overrides.hasOwnProperty('assignToAll') ? overrides.assignToAll! : true,
        customFieldId: overrides && overrides.hasOwnProperty('customFieldId') ? overrides.customFieldId! : 'eece5269-2919-48ee-855e-458f121bcf83',
        customFieldOptionId: overrides && overrides.hasOwnProperty('customFieldOptionId') ? overrides.customFieldOptionId! : '593d5a66-3365-4184-88f6-384e615b103f',
        timeForAssignments: overrides && overrides.hasOwnProperty('timeForAssignments') ? overrides.timeForAssignments! : relationshipsToOmit.has('TimeTracking_TimeForAssignmentsInput') ? {} as TimeTracking_TimeForAssignmentsInput : aTimeTracking_TimeForAssignmentsInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ManageCustomFieldOptionAssignmentPayload = (overrides?: Partial<TimeTracking_ManageCustomFieldOptionAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageCustomFieldOptionAssignmentPayload' } & TimeTracking_ManageCustomFieldOptionAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageCustomFieldOptionAssignmentPayload');
    return {
        __typename: 'TimeTracking_ManageCustomFieldOptionAssignmentPayload',
        assignedGroups: overrides && overrides.hasOwnProperty('assignedGroups') ? overrides.assignedGroups! : [relationshipsToOmit.has('TimeTracking_AssignedGroup') ? {} as TimeTracking_AssignedGroup : aTimeTracking_AssignedGroup({}, relationshipsToOmit)],
        assignedTimeFor: overrides && overrides.hasOwnProperty('assignedTimeFor') ? overrides.assignedTimeFor! : [relationshipsToOmit.has('TimeTracking_AssignedWorker') ? {} as TimeTracking_AssignedWorker : aTimeTracking_AssignedWorker({}, relationshipsToOmit)],
        customField: overrides && overrides.hasOwnProperty('customField') ? overrides.customField! : relationshipsToOmit.has('AppFoundations_CustomFieldDefinition') ? {} as AppFoundations_CustomFieldDefinition : anAppFoundations_CustomFieldDefinition({}, relationshipsToOmit),
        customFieldOption: overrides && overrides.hasOwnProperty('customFieldOption') ? overrides.customFieldOption! : relationshipsToOmit.has('TimeTracking_CustomFieldOption') ? {} as TimeTracking_CustomFieldOption : aTimeTracking_CustomFieldOption({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'in',
        unassignedGroups: overrides && overrides.hasOwnProperty('unassignedGroups') ? overrides.unassignedGroups! : [relationshipsToOmit.has('TimeTracking_AssignedGroup') ? {} as TimeTracking_AssignedGroup : aTimeTracking_AssignedGroup({}, relationshipsToOmit)],
        unassignedTimeFor: overrides && overrides.hasOwnProperty('unassignedTimeFor') ? overrides.unassignedTimeFor! : [relationshipsToOmit.has('TimeTracking_AssignedWorker') ? {} as TimeTracking_AssignedWorker : aTimeTracking_AssignedWorker({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError = (overrides?: Partial<TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError' } & TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError');
    return {
        __typename: 'TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'ut',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'eum',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'inventore',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'eligendi',
    };
};

export const aTimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentInput = (overrides?: Partial<TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentInput');
    return {
        assignToAll: overrides && overrides.hasOwnProperty('assignToAll') ? overrides.assignToAll! : false,
        customFieldId: overrides && overrides.hasOwnProperty('customFieldId') ? overrides.customFieldId! : 'c035de94-ef24-48a8-b6a9-7ebbfeefb446',
        customFieldOptionId: overrides && overrides.hasOwnProperty('customFieldOptionId') ? overrides.customFieldOptionId! : '004fe558-26d1-494b-9a29-c225a42e2779',
        timeAgainstAssignments: overrides && overrides.hasOwnProperty('timeAgainstAssignments') ? overrides.timeAgainstAssignments! : relationshipsToOmit.has('TimeTracking_TimeAgainstAssignmentsInput') ? {} as TimeTracking_TimeAgainstAssignmentsInput : aTimeTracking_TimeAgainstAssignmentsInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentPayload = (overrides?: Partial<TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentPayload' } & TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentPayload');
    return {
        __typename: 'TimeTracking_ManageCustomFieldOptionTimeAgainstAssignmentPayload',
        assignedTimeAgainst: overrides && overrides.hasOwnProperty('assignedTimeAgainst') ? overrides.assignedTimeAgainst! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
        customField: overrides && overrides.hasOwnProperty('customField') ? overrides.customField! : relationshipsToOmit.has('AppFoundations_CustomFieldDefinition') ? {} as AppFoundations_CustomFieldDefinition : anAppFoundations_CustomFieldDefinition({}, relationshipsToOmit),
        customFieldOption: overrides && overrides.hasOwnProperty('customFieldOption') ? overrides.customFieldOption! : relationshipsToOmit.has('TimeTracking_CustomFieldOption') ? {} as TimeTracking_CustomFieldOption : aTimeTracking_CustomFieldOption({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'rerum',
        unassignedTimeAgainst: overrides && overrides.hasOwnProperty('unassignedTimeAgainst') ? overrides.unassignedTimeAgainst! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_ManageCustomFieldToCustomerAssignmentError = (overrides?: Partial<TimeTracking_ManageCustomFieldToCustomerAssignmentError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageCustomFieldToCustomerAssignmentError' } & TimeTracking_ManageCustomFieldToCustomerAssignmentError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageCustomFieldToCustomerAssignmentError');
    return {
        __typename: 'TimeTracking_ManageCustomFieldToCustomerAssignmentError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'ipsum',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'quam',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'qui',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'est',
    };
};

export const aTimeTracking_ManageCustomFieldToCustomerAssignmentPayload = (overrides?: Partial<TimeTracking_ManageCustomFieldToCustomerAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageCustomFieldToCustomerAssignmentPayload' } & TimeTracking_ManageCustomFieldToCustomerAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageCustomFieldToCustomerAssignmentPayload');
    return {
        __typename: 'TimeTracking_ManageCustomFieldToCustomerAssignmentPayload',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'qui',
    };
};

export const aTimeTracking_ManageCustomFieldsError = (overrides?: Partial<TimeTracking_ManageCustomFieldsError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageCustomFieldsError' } & TimeTracking_ManageCustomFieldsError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageCustomFieldsError');
    return {
        __typename: 'TimeTracking_ManageCustomFieldsError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'est',
        element: overrides && overrides.hasOwnProperty('element') ? overrides.element! : 'nulla',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'doloribus',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'eius',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'amet',
    };
};

export const aTimeTracking_ManageCustomFieldsInput = (overrides?: Partial<TimeTracking_ManageCustomFieldsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManageCustomFieldsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageCustomFieldsInput');
    return {
        fields: overrides && overrides.hasOwnProperty('fields') ? overrides.fields! : [relationshipsToOmit.has('TimeTracking_ManageCustomFieldInput') ? {} as TimeTracking_ManageCustomFieldInput : aTimeTracking_ManageCustomFieldInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_ManageCustomFieldsPayload = (overrides?: Partial<TimeTracking_ManageCustomFieldsPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageCustomFieldsPayload' } & TimeTracking_ManageCustomFieldsPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageCustomFieldsPayload');
    return {
        __typename: 'TimeTracking_ManageCustomFieldsPayload',
        customFields: overrides && overrides.hasOwnProperty('customFields') ? overrides.customFields! : relationshipsToOmit.has('TimeTracking_CustomFieldDefinitionConnection') ? {} as TimeTracking_CustomFieldDefinitionConnection : aTimeTracking_CustomFieldDefinitionConnection({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'possimus',
    };
};

export const aTimeTracking_ManagePostError = (overrides?: Partial<TimeTracking_ManagePostError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManagePostError' } & TimeTracking_ManagePostError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManagePostError');
    return {
        __typename: 'TimeTracking_ManagePostError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'ut',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'cupiditate',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'explicabo',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'recusandae',
    };
};

export const aTimeTracking_ManagePostInput = (overrides?: Partial<TimeTracking_ManagePostInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManagePostInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManagePostInput');
    return {
        content: overrides && overrides.hasOwnProperty('content') ? overrides.content! : 'sed',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'e75a29ab-4ac1-4e3b-b44b-3c91f383f7e1',
        parentPostId: overrides && overrides.hasOwnProperty('parentPostId') ? overrides.parentPostId! : '5befd5f3-ae29-4759-9374-f606b3f2ca67',
        projectRefs: overrides && overrides.hasOwnProperty('projectRefs') ? overrides.projectRefs! : relationshipsToOmit.has('TimeTracking_PostProjectRefsInput') ? {} as TimeTracking_PostProjectRefsInput : aTimeTracking_PostProjectRefsInput({}, relationshipsToOmit),
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : 'b188da1c-9623-44b9-ab1e-441bdb10c968',
        workerType: overrides && overrides.hasOwnProperty('workerType') ? overrides.workerType! : 'eum',
    };
};

export const aTimeTracking_ManagePostPayload = (overrides?: Partial<TimeTracking_ManagePostPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManagePostPayload' } & TimeTracking_ManagePostPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManagePostPayload');
    return {
        __typename: 'TimeTracking_ManagePostPayload',
        post: overrides && overrides.hasOwnProperty('post') ? overrides.post! : relationshipsToOmit.has('TimeTracking_Post') ? {} as TimeTracking_Post : aTimeTracking_Post({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'amet',
    };
};

export const aTimeTracking_ManageStandardFieldAssignmentError = (overrides?: Partial<TimeTracking_ManageStandardFieldAssignmentError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageStandardFieldAssignmentError' } & TimeTracking_ManageStandardFieldAssignmentError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageStandardFieldAssignmentError');
    return {
        __typename: 'TimeTracking_ManageStandardFieldAssignmentError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'occaecati',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'ea',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'quia',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'velit',
    };
};

export const aTimeTracking_ManageStandardFieldAssignmentInput = (overrides?: Partial<TimeTracking_ManageStandardFieldAssignmentInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManageStandardFieldAssignmentInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageStandardFieldAssignmentInput');
    return {
        assignToAll: overrides && overrides.hasOwnProperty('assignToAll') ? overrides.assignToAll! : false,
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'expedita',
        timeAgainstAssignments: overrides && overrides.hasOwnProperty('timeAgainstAssignments') ? overrides.timeAgainstAssignments! : relationshipsToOmit.has('TimeTracking_TimeAgainstAssignmentsInput') ? {} as TimeTracking_TimeAgainstAssignmentsInput : aTimeTracking_TimeAgainstAssignmentsInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ManageStandardFieldAssignmentPayload = (overrides?: Partial<TimeTracking_ManageStandardFieldAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageStandardFieldAssignmentPayload' } & TimeTracking_ManageStandardFieldAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageStandardFieldAssignmentPayload');
    return {
        __typename: 'TimeTracking_ManageStandardFieldAssignmentPayload',
        assignToAll: overrides && overrides.hasOwnProperty('assignToAll') ? overrides.assignToAll! : false,
        assignedCustomers: overrides && overrides.hasOwnProperty('assignedCustomers') ? overrides.assignedCustomers! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'et',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'laborum',
        unassignedCustomers: overrides && overrides.hasOwnProperty('unassignedCustomers') ? overrides.unassignedCustomers! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError = (overrides?: Partial<TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError' } & TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError');
    return {
        __typename: 'TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'omnis',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'tempora',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'et',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'et',
    };
};

export const aTimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentInput = (overrides?: Partial<TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentInput');
    return {
        assignToAll: overrides && overrides.hasOwnProperty('assignToAll') ? overrides.assignToAll! : false,
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'aspernatur',
        standardFieldOptionId: overrides && overrides.hasOwnProperty('standardFieldOptionId') ? overrides.standardFieldOptionId! : '783d6e76-4a0c-4c96-8f3e-606c1952d656',
        timeAgainstAssignments: overrides && overrides.hasOwnProperty('timeAgainstAssignments') ? overrides.timeAgainstAssignments! : relationshipsToOmit.has('TimeTracking_TimeAgainstAssignmentsInput') ? {} as TimeTracking_TimeAgainstAssignmentsInput : aTimeTracking_TimeAgainstAssignmentsInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentPayload = (overrides?: Partial<TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentPayload' } & TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentPayload');
    return {
        __typename: 'TimeTracking_ManageStandardFieldOptionTimeAgainstAssignmentPayload',
        assignedCustomers: overrides && overrides.hasOwnProperty('assignedCustomers') ? overrides.assignedCustomers! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'doloremque',
        standardFieldOptionId: overrides && overrides.hasOwnProperty('standardFieldOptionId') ? overrides.standardFieldOptionId! : 'bbf5f5b4-041d-4bf0-97dd-43695b93dd4a',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'nobis',
        unassignedCustomers: overrides && overrides.hasOwnProperty('unassignedCustomers') ? overrides.unassignedCustomers! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_ManageStandardFieldOptionTimeForAssignmentError = (overrides?: Partial<TimeTracking_ManageStandardFieldOptionTimeForAssignmentError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageStandardFieldOptionTimeForAssignmentError' } & TimeTracking_ManageStandardFieldOptionTimeForAssignmentError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageStandardFieldOptionTimeForAssignmentError');
    return {
        __typename: 'TimeTracking_ManageStandardFieldOptionTimeForAssignmentError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'aspernatur',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'praesentium',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'consequatur',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'enim',
    };
};

export const aTimeTracking_ManageStandardFieldOptionTimeForAssignmentInput = (overrides?: Partial<TimeTracking_ManageStandardFieldOptionTimeForAssignmentInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManageStandardFieldOptionTimeForAssignmentInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageStandardFieldOptionTimeForAssignmentInput');
    return {
        assignToAll: overrides && overrides.hasOwnProperty('assignToAll') ? overrides.assignToAll! : false,
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'ratione',
        standardFieldOptionId: overrides && overrides.hasOwnProperty('standardFieldOptionId') ? overrides.standardFieldOptionId! : '8560b77d-ee24-445d-a2df-eb7b7c7e48a4',
        timeForAssignments: overrides && overrides.hasOwnProperty('timeForAssignments') ? overrides.timeForAssignments! : relationshipsToOmit.has('TimeTracking_TimeForAssignmentsInput') ? {} as TimeTracking_TimeForAssignmentsInput : aTimeTracking_TimeForAssignmentsInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ManageStandardFieldOptionTimeForAssignmentPayload = (overrides?: Partial<TimeTracking_ManageStandardFieldOptionTimeForAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageStandardFieldOptionTimeForAssignmentPayload' } & TimeTracking_ManageStandardFieldOptionTimeForAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageStandardFieldOptionTimeForAssignmentPayload');
    return {
        __typename: 'TimeTracking_ManageStandardFieldOptionTimeForAssignmentPayload',
        assignedGroups: overrides && overrides.hasOwnProperty('assignedGroups') ? overrides.assignedGroups! : [relationshipsToOmit.has('TimeTracking_AssignedGroup') ? {} as TimeTracking_AssignedGroup : aTimeTracking_AssignedGroup({}, relationshipsToOmit)],
        assignedTimeFor: overrides && overrides.hasOwnProperty('assignedTimeFor') ? overrides.assignedTimeFor! : [relationshipsToOmit.has('TimeTracking_AssignedWorker') ? {} as TimeTracking_AssignedWorker : aTimeTracking_AssignedWorker({}, relationshipsToOmit)],
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'adipisci',
        standardFieldOptionId: overrides && overrides.hasOwnProperty('standardFieldOptionId') ? overrides.standardFieldOptionId! : 'cb49a899-1227-48d9-87b1-74901ed612ef',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'quasi',
        unassignedGroups: overrides && overrides.hasOwnProperty('unassignedGroups') ? overrides.unassignedGroups! : [relationshipsToOmit.has('TimeTracking_AssignedGroup') ? {} as TimeTracking_AssignedGroup : aTimeTracking_AssignedGroup({}, relationshipsToOmit)],
        unassignedTimeFor: overrides && overrides.hasOwnProperty('unassignedTimeFor') ? overrides.unassignedTimeFor! : [relationshipsToOmit.has('TimeTracking_AssignedWorker') ? {} as TimeTracking_AssignedWorker : aTimeTracking_AssignedWorker({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_ManageTimeAgainstCustomFieldAssignmentError = (overrides?: Partial<TimeTracking_ManageTimeAgainstCustomFieldAssignmentError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageTimeAgainstCustomFieldAssignmentError' } & TimeTracking_ManageTimeAgainstCustomFieldAssignmentError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageTimeAgainstCustomFieldAssignmentError');
    return {
        __typename: 'TimeTracking_ManageTimeAgainstCustomFieldAssignmentError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'inventore',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'labore',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'autem',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'nesciunt',
    };
};

export const aTimeTracking_ManageTimeAgainstCustomFieldAssignmentPayload = (overrides?: Partial<TimeTracking_ManageTimeAgainstCustomFieldAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageTimeAgainstCustomFieldAssignmentPayload' } & TimeTracking_ManageTimeAgainstCustomFieldAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageTimeAgainstCustomFieldAssignmentPayload');
    return {
        __typename: 'TimeTracking_ManageTimeAgainstCustomFieldAssignmentPayload',
        assignedCustomFields: overrides && overrides.hasOwnProperty('assignedCustomFields') ? overrides.assignedCustomFields! : [relationshipsToOmit.has('AppFoundations_CustomFieldDefinition') ? {} as AppFoundations_CustomFieldDefinition : anAppFoundations_CustomFieldDefinition({}, relationshipsToOmit)],
        assignedToAll: overrides && overrides.hasOwnProperty('assignedToAll') ? overrides.assignedToAll! : false,
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'praesentium',
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainst') ? {} as TimeTracking_TrackTimeAgainst : aTimeTracking_TrackTimeAgainst({}, relationshipsToOmit),
        unassignedCustomFields: overrides && overrides.hasOwnProperty('unassignedCustomFields') ? overrides.unassignedCustomFields! : [relationshipsToOmit.has('AppFoundations_CustomFieldDefinition') ? {} as AppFoundations_CustomFieldDefinition : anAppFoundations_CustomFieldDefinition({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_ManageTimeAgainstFieldAssignmentError = (overrides?: Partial<TimeTracking_ManageTimeAgainstFieldAssignmentError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageTimeAgainstFieldAssignmentError' } & TimeTracking_ManageTimeAgainstFieldAssignmentError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageTimeAgainstFieldAssignmentError');
    return {
        __typename: 'TimeTracking_ManageTimeAgainstFieldAssignmentError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'ut',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'alias',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'error',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'quam',
    };
};

export const aTimeTracking_ManageTimeAgainstFieldAssignmentInput = (overrides?: Partial<TimeTracking_ManageTimeAgainstFieldAssignmentInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManageTimeAgainstFieldAssignmentInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageTimeAgainstFieldAssignmentInput');
    return {
        customFieldAssignments: overrides && overrides.hasOwnProperty('customFieldAssignments') ? overrides.customFieldAssignments! : relationshipsToOmit.has('TimeTracking_CustomFieldAssignmentsInput') ? {} as TimeTracking_CustomFieldAssignmentsInput : aTimeTracking_CustomFieldAssignmentsInput({}, relationshipsToOmit),
        standardFieldAssignments: overrides && overrides.hasOwnProperty('standardFieldAssignments') ? overrides.standardFieldAssignments! : relationshipsToOmit.has('TimeTracking_StandardFieldAssignmentsInput') ? {} as TimeTracking_StandardFieldAssignmentsInput : aTimeTracking_StandardFieldAssignmentsInput({}, relationshipsToOmit),
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainstInput') ? {} as TimeTracking_TrackTimeAgainstInput : aTimeTracking_TrackTimeAgainstInput({}, relationshipsToOmit),
        timeAgainstList: overrides && overrides.hasOwnProperty('timeAgainstList') ? overrides.timeAgainstList! : [relationshipsToOmit.has('TimeTracking_TrackTimeAgainstInput') ? {} as TimeTracking_TrackTimeAgainstInput : aTimeTracking_TrackTimeAgainstInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_ManageTimeAgainstFieldAssignmentPayload = (overrides?: Partial<TimeTracking_ManageTimeAgainstFieldAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageTimeAgainstFieldAssignmentPayload' } & TimeTracking_ManageTimeAgainstFieldAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageTimeAgainstFieldAssignmentPayload');
    return {
        __typename: 'TimeTracking_ManageTimeAgainstFieldAssignmentPayload',
        customFieldResult: overrides && overrides.hasOwnProperty('customFieldResult') ? overrides.customFieldResult! : relationshipsToOmit.has('TimeTracking_ManageTimeAgainstCustomFieldAssignmentError') ? {} as TimeTracking_ManageTimeAgainstCustomFieldAssignmentError : aTimeTracking_ManageTimeAgainstCustomFieldAssignmentError({}, relationshipsToOmit),
        standardFieldResult: overrides && overrides.hasOwnProperty('standardFieldResult') ? overrides.standardFieldResult! : relationshipsToOmit.has('TimeTracking_ManageTimeAgainstStandardFieldAssignmentError') ? {} as TimeTracking_ManageTimeAgainstStandardFieldAssignmentError : aTimeTracking_ManageTimeAgainstStandardFieldAssignmentError({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'quos',
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainst') ? {} as TimeTracking_TrackTimeAgainst : aTimeTracking_TrackTimeAgainst({}, relationshipsToOmit),
        timeAgainstList: overrides && overrides.hasOwnProperty('timeAgainstList') ? overrides.timeAgainstList! : [relationshipsToOmit.has('TimeTracking_TrackTimeAgainst') ? {} as TimeTracking_TrackTimeAgainst : aTimeTracking_TrackTimeAgainst({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_ManageTimeAgainstStandardFieldAssignmentError = (overrides?: Partial<TimeTracking_ManageTimeAgainstStandardFieldAssignmentError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageTimeAgainstStandardFieldAssignmentError' } & TimeTracking_ManageTimeAgainstStandardFieldAssignmentError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageTimeAgainstStandardFieldAssignmentError');
    return {
        __typename: 'TimeTracking_ManageTimeAgainstStandardFieldAssignmentError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'vel',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'beatae',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'sit',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'nesciunt',
    };
};

export const aTimeTracking_ManageTimeAgainstStandardFieldAssignmentPayload = (overrides?: Partial<TimeTracking_ManageTimeAgainstStandardFieldAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageTimeAgainstStandardFieldAssignmentPayload' } & TimeTracking_ManageTimeAgainstStandardFieldAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageTimeAgainstStandardFieldAssignmentPayload');
    return {
        __typename: 'TimeTracking_ManageTimeAgainstStandardFieldAssignmentPayload',
        assignedStandardFields: overrides && overrides.hasOwnProperty('assignedStandardFields') ? overrides.assignedStandardFields! : [relationshipsToOmit.has('TimeTracking_AssignedStandardField') ? {} as TimeTracking_AssignedStandardField : aTimeTracking_AssignedStandardField({}, relationshipsToOmit)],
        assignedToAll: overrides && overrides.hasOwnProperty('assignedToAll') ? overrides.assignedToAll! : true,
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'hic',
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainst') ? {} as TimeTracking_TrackTimeAgainst : aTimeTracking_TrackTimeAgainst({}, relationshipsToOmit),
        unassignedStandardFields: overrides && overrides.hasOwnProperty('unassignedStandardFields') ? overrides.unassignedStandardFields! : [relationshipsToOmit.has('TimeTracking_AssignedStandardField') ? {} as TimeTracking_AssignedStandardField : aTimeTracking_AssignedStandardField({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_ManageTimeAgainstTimeForAssignmentError = (overrides?: Partial<TimeTracking_ManageTimeAgainstTimeForAssignmentError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageTimeAgainstTimeForAssignmentError' } & TimeTracking_ManageTimeAgainstTimeForAssignmentError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageTimeAgainstTimeForAssignmentError');
    return {
        __typename: 'TimeTracking_ManageTimeAgainstTimeForAssignmentError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'ducimus',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'enim',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'iure',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'et',
    };
};

export const aTimeTracking_ManageTimeAgainstTimeForAssignmentInput = (overrides?: Partial<TimeTracking_ManageTimeAgainstTimeForAssignmentInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManageTimeAgainstTimeForAssignmentInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageTimeAgainstTimeForAssignmentInput');
    return {
        assignToAll: overrides && overrides.hasOwnProperty('assignToAll') ? overrides.assignToAll! : false,
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainstInput') ? {} as TimeTracking_TrackTimeAgainstInput : aTimeTracking_TrackTimeAgainstInput({}, relationshipsToOmit),
        timeAgainstList: overrides && overrides.hasOwnProperty('timeAgainstList') ? overrides.timeAgainstList! : [relationshipsToOmit.has('TimeTracking_TrackTimeAgainstInput') ? {} as TimeTracking_TrackTimeAgainstInput : aTimeTracking_TrackTimeAgainstInput({}, relationshipsToOmit)],
        timeForAssignments: overrides && overrides.hasOwnProperty('timeForAssignments') ? overrides.timeForAssignments! : relationshipsToOmit.has('TimeTracking_TimeForAssignmentsInput') ? {} as TimeTracking_TimeForAssignmentsInput : aTimeTracking_TimeForAssignmentsInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ManageTimeAgainstTimeForAssignmentPayload = (overrides?: Partial<TimeTracking_ManageTimeAgainstTimeForAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageTimeAgainstTimeForAssignmentPayload' } & TimeTracking_ManageTimeAgainstTimeForAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageTimeAgainstTimeForAssignmentPayload');
    return {
        __typename: 'TimeTracking_ManageTimeAgainstTimeForAssignmentPayload',
        assignToAll: overrides && overrides.hasOwnProperty('assignToAll') ? overrides.assignToAll! : true,
        assignedGroups: overrides && overrides.hasOwnProperty('assignedGroups') ? overrides.assignedGroups! : [relationshipsToOmit.has('TimeTracking_AssignedGroup') ? {} as TimeTracking_AssignedGroup : aTimeTracking_AssignedGroup({}, relationshipsToOmit)],
        assignedTimeFor: overrides && overrides.hasOwnProperty('assignedTimeFor') ? overrides.assignedTimeFor! : [relationshipsToOmit.has('TimeTracking_AssignedWorker') ? {} as TimeTracking_AssignedWorker : aTimeTracking_AssignedWorker({}, relationshipsToOmit)],
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'minus',
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainst') ? {} as TimeTracking_TrackTimeAgainst : aTimeTracking_TrackTimeAgainst({}, relationshipsToOmit),
        timeAgainstList: overrides && overrides.hasOwnProperty('timeAgainstList') ? overrides.timeAgainstList! : [relationshipsToOmit.has('TimeTracking_TrackTimeAgainst') ? {} as TimeTracking_TrackTimeAgainst : aTimeTracking_TrackTimeAgainst({}, relationshipsToOmit)],
        unassignedGroups: overrides && overrides.hasOwnProperty('unassignedGroups') ? overrides.unassignedGroups! : [relationshipsToOmit.has('TimeTracking_AssignedGroup') ? {} as TimeTracking_AssignedGroup : aTimeTracking_AssignedGroup({}, relationshipsToOmit)],
        unassignedTimeFor: overrides && overrides.hasOwnProperty('unassignedTimeFor') ? overrides.unassignedTimeFor! : [relationshipsToOmit.has('TimeTracking_AssignedWorker') ? {} as TimeTracking_AssignedWorker : aTimeTracking_AssignedWorker({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_ManageUnifiedUserSettingsError = (overrides?: Partial<TimeTracking_ManageUnifiedUserSettingsError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageUnifiedUserSettingsError' } & TimeTracking_ManageUnifiedUserSettingsError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageUnifiedUserSettingsError');
    return {
        __typename: 'TimeTracking_ManageUnifiedUserSettingsError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'ullam',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'amet',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'dolores',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'quos',
    };
};

export const aTimeTracking_ManageUnifiedUserSettingsInput = (overrides?: Partial<TimeTracking_ManageUnifiedUserSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManageUnifiedUserSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageUnifiedUserSettingsInput');
    return {
        locationTracking: overrides && overrides.hasOwnProperty('locationTracking') ? overrides.locationTracking! : relationshipsToOmit.has('TimeTracking_UpdateUserLocationTrackingInput') ? {} as TimeTracking_UpdateUserLocationTrackingInput : aTimeTracking_UpdateUserLocationTrackingInput({}, relationshipsToOmit),
        overtimeNotifications: overrides && overrides.hasOwnProperty('overtimeNotifications') ? overrides.overtimeNotifications! : relationshipsToOmit.has('TimeTracking_UpdateOvertimeNotificationSettingsInput') ? {} as TimeTracking_UpdateOvertimeNotificationSettingsInput : aTimeTracking_UpdateOvertimeNotificationSettingsInput({}, relationshipsToOmit),
        scheduleNotifications: overrides && overrides.hasOwnProperty('scheduleNotifications') ? overrides.scheduleNotifications! : relationshipsToOmit.has('TimeTracking_UpdateUnifiedUserScheduleNotificationSettingsInput') ? {} as TimeTracking_UpdateUnifiedUserScheduleNotificationSettingsInput : aTimeTracking_UpdateUnifiedUserScheduleNotificationSettingsInput({}, relationshipsToOmit),
        settingsFor: overrides && overrides.hasOwnProperty('settingsFor') ? overrides.settingsFor! : relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ManageUnifiedUserSettingsPayload = (overrides?: Partial<TimeTracking_ManageUnifiedUserSettingsPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageUnifiedUserSettingsPayload' } & TimeTracking_ManageUnifiedUserSettingsPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageUnifiedUserSettingsPayload');
    return {
        __typename: 'TimeTracking_ManageUnifiedUserSettingsPayload',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'quidem',
        userSettings: overrides && overrides.hasOwnProperty('userSettings') ? overrides.userSettings! : relationshipsToOmit.has('TimeTracking_UnifiedUserSettings') ? {} as TimeTracking_UnifiedUserSettings : aTimeTracking_UnifiedUserSettings({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ManageUserSettingsError = (overrides?: Partial<TimeTracking_ManageUserSettingsError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageUserSettingsError' } & TimeTracking_ManageUserSettingsError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageUserSettingsError');
    return {
        __typename: 'TimeTracking_ManageUserSettingsError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'aperiam',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'modi',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'praesentium',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'quod',
    };
};

export const aTimeTracking_ManageUserSettingsInput = (overrides?: Partial<TimeTracking_ManageUserSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManageUserSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageUserSettingsInput');
    return {
        clockIn: overrides && overrides.hasOwnProperty('clockIn') ? overrides.clockIn! : relationshipsToOmit.has('TimeTracking_UpdateShiftNotificationSettingsInput') ? {} as TimeTracking_UpdateShiftNotificationSettingsInput : aTimeTracking_UpdateShiftNotificationSettingsInput({}, relationshipsToOmit),
        clockOut: overrides && overrides.hasOwnProperty('clockOut') ? overrides.clockOut! : relationshipsToOmit.has('TimeTracking_UpdateShiftNotificationSettingsInput') ? {} as TimeTracking_UpdateShiftNotificationSettingsInput : aTimeTracking_UpdateShiftNotificationSettingsInput({}, relationshipsToOmit),
        notificationEnabledForDays: overrides && overrides.hasOwnProperty('notificationEnabledForDays') ? overrides.notificationEnabledForDays! : relationshipsToOmit.has('TimeTracking_UpdateSettingNotificationReminderDaysInput') ? {} as TimeTracking_UpdateSettingNotificationReminderDaysInput : aTimeTracking_UpdateSettingNotificationReminderDaysInput({}, relationshipsToOmit),
        settingsFor: overrides && overrides.hasOwnProperty('settingsFor') ? overrides.settingsFor! : relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ManageUserSettingsPayload = (overrides?: Partial<TimeTracking_ManageUserSettingsPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManageUserSettingsPayload' } & TimeTracking_ManageUserSettingsPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManageUserSettingsPayload');
    return {
        __typename: 'TimeTracking_ManageUserSettingsPayload',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'et',
        userSettings: overrides && overrides.hasOwnProperty('userSettings') ? overrides.userSettings! : relationshipsToOmit.has('TimeTracking_UserSettings') ? {} as TimeTracking_UserSettings : aTimeTracking_UserSettings({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ManagementPermissions = (overrides?: Partial<TimeTracking_ManagementPermissions>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManagementPermissions' } & TimeTracking_ManagementPermissions => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManagementPermissions');
    return {
        __typename: 'TimeTracking_ManagementPermissions',
        approveTimesheets: overrides && overrides.hasOwnProperty('approveTimesheets') ? overrides.approveTimesheets! : false,
        manageAuthorization: overrides && overrides.hasOwnProperty('manageAuthorization') ? overrides.manageAuthorization! : false,
        manageMyTimesheets: overrides && overrides.hasOwnProperty('manageMyTimesheets') ? overrides.manageMyTimesheets! : false,
        manageStandardFields: overrides && overrides.hasOwnProperty('manageStandardFields') ? overrides.manageStandardFields! : false,
        manageTimesheets: overrides && overrides.hasOwnProperty('manageTimesheets') ? overrides.manageTimesheets! : false,
        manageUsers: overrides && overrides.hasOwnProperty('manageUsers') ? overrides.manageUsers! : true,
        viewReports: overrides && overrides.hasOwnProperty('viewReports') ? overrides.viewReports! : false,
    };
};

export const aTimeTracking_ManagementPermissionsInput = (overrides?: Partial<TimeTracking_ManagementPermissionsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManagementPermissionsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManagementPermissionsInput');
    return {
        approveTimesheets: overrides && overrides.hasOwnProperty('approveTimesheets') ? overrides.approveTimesheets! : false,
        manageAuthorization: overrides && overrides.hasOwnProperty('manageAuthorization') ? overrides.manageAuthorization! : false,
        manageMyTimesheets: overrides && overrides.hasOwnProperty('manageMyTimesheets') ? overrides.manageMyTimesheets! : false,
        manageStandardFields: overrides && overrides.hasOwnProperty('manageStandardFields') ? overrides.manageStandardFields! : true,
        manageTimesheets: overrides && overrides.hasOwnProperty('manageTimesheets') ? overrides.manageTimesheets! : false,
        manageUsers: overrides && overrides.hasOwnProperty('manageUsers') ? overrides.manageUsers! : true,
        viewReports: overrides && overrides.hasOwnProperty('viewReports') ? overrides.viewReports! : false,
    };
};

export const aTimeTracking_ManagerApprovalReminder = (overrides?: Partial<TimeTracking_ManagerApprovalReminder>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManagerApprovalReminder' } & TimeTracking_ManagerApprovalReminder => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManagerApprovalReminder');
    return {
        __typename: 'TimeTracking_ManagerApprovalReminder',
        payPeriod: overrides && overrides.hasOwnProperty('payPeriod') ? overrides.payPeriod! : relationshipsToOmit.has('TimeTracking_PayPeriodApprovalReminder') ? {} as TimeTracking_PayPeriodApprovalReminder : aTimeTracking_PayPeriodApprovalReminder({}, relationshipsToOmit),
        reminderBasedOn: overrides && overrides.hasOwnProperty('reminderBasedOn') ? overrides.reminderBasedOn! : relationshipsToOmit.has('TimeTracking_ApprovalReminderBasisSetting') ? {} as TimeTracking_ApprovalReminderBasisSetting : aTimeTracking_ApprovalReminderBasisSetting({}, relationshipsToOmit),
        week: overrides && overrides.hasOwnProperty('week') ? overrides.week! : relationshipsToOmit.has('TimeTracking_WeeklyApprovalReminder') ? {} as TimeTracking_WeeklyApprovalReminder : aTimeTracking_WeeklyApprovalReminder({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ManagerApprovalReminderInput = (overrides?: Partial<TimeTracking_ManagerApprovalReminderInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManagerApprovalReminderInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManagerApprovalReminderInput');
    return {
        payPeriod: overrides && overrides.hasOwnProperty('payPeriod') ? overrides.payPeriod! : relationshipsToOmit.has('TimeTracking_PayPeriodApprovalReminderInput') ? {} as TimeTracking_PayPeriodApprovalReminderInput : aTimeTracking_PayPeriodApprovalReminderInput({}, relationshipsToOmit),
        reminderBasedOn: overrides && overrides.hasOwnProperty('reminderBasedOn') ? overrides.reminderBasedOn! : relationshipsToOmit.has('TimeTracking_UpdateSettingApprovalReminderBasisInput') ? {} as TimeTracking_UpdateSettingApprovalReminderBasisInput : aTimeTracking_UpdateSettingApprovalReminderBasisInput({}, relationshipsToOmit),
        week: overrides && overrides.hasOwnProperty('week') ? overrides.week! : relationshipsToOmit.has('TimeTracking_WeeklyApprovalReminderInput') ? {} as TimeTracking_WeeklyApprovalReminderInput : aTimeTracking_WeeklyApprovalReminderInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ManagerApprovalSettings = (overrides?: Partial<TimeTracking_ManagerApprovalSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ManagerApprovalSettings' } & TimeTracking_ManagerApprovalSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManagerApprovalSettings');
    return {
        __typename: 'TimeTracking_ManagerApprovalSettings',
        reminders: overrides && overrides.hasOwnProperty('reminders') ? overrides.reminders! : relationshipsToOmit.has('TimeTracking_ManagerApprovalReminder') ? {} as TimeTracking_ManagerApprovalReminder : aTimeTracking_ManagerApprovalReminder({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ManagerApprovalSettingsInput = (overrides?: Partial<TimeTracking_ManagerApprovalSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ManagerApprovalSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ManagerApprovalSettingsInput');
    return {
        reminders: overrides && overrides.hasOwnProperty('reminders') ? overrides.reminders! : relationshipsToOmit.has('TimeTracking_ManagerApprovalReminderInput') ? {} as TimeTracking_ManagerApprovalReminderInput : aTimeTracking_ManagerApprovalReminderInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_MarkPostsReadError = (overrides?: Partial<TimeTracking_MarkPostsReadError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_MarkPostsReadError' } & TimeTracking_MarkPostsReadError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_MarkPostsReadError');
    return {
        __typename: 'TimeTracking_MarkPostsReadError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'quia',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'laborum',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'eaque',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'non',
    };
};

export const aTimeTracking_MarkPostsReadInput = (overrides?: Partial<TimeTracking_MarkPostsReadInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_MarkPostsReadInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_MarkPostsReadInput');
    return {
        entityId: overrides && overrides.hasOwnProperty('entityId') ? overrides.entityId! : '85c830f2-20d4-4b84-bfda-542dde1b4dc6',
        entityType: overrides && overrides.hasOwnProperty('entityType') ? overrides.entityType! : TimeTracking_ReadTrackingEntityType.All,
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : '760b3ac8-7de2-40df-8f17-bba1a097e782',
        workerType: overrides && overrides.hasOwnProperty('workerType') ? overrides.workerType! : 'sint',
    };
};

export const aTimeTracking_MarkPostsReadPayload = (overrides?: Partial<TimeTracking_MarkPostsReadPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_MarkPostsReadPayload' } & TimeTracking_MarkPostsReadPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_MarkPostsReadPayload');
    return {
        __typename: 'TimeTracking_MarkPostsReadPayload',
        readTo: overrides && overrides.hasOwnProperty('readTo') ? overrides.readTo! : 'assumenda',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'maxime',
    };
};

export const aTimeTracking_MutationError = (overrides?: Partial<TimeTracking_MutationError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_MutationError' } & TimeTracking_MutationError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_MutationError');
    return {
        __typename: 'TimeTracking_MutationError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'est',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'fugiat',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'minus',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'aut',
    };
};

export const aTimeTracking_MutationSuccess = (overrides?: Partial<TimeTracking_MutationSuccess>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_MutationSuccess' } & TimeTracking_MutationSuccess => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_MutationSuccess');
    return {
        __typename: 'TimeTracking_MutationSuccess',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'excepturi',
    };
};

export const aTimeTracking_NearbyCustomersConnection = (overrides?: Partial<TimeTracking_NearbyCustomersConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_NearbyCustomersConnection' } & TimeTracking_NearbyCustomersConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_NearbyCustomersConnection');
    return {
        __typename: 'TimeTracking_NearbyCustomersConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_NearbyCustomersEdge') ? {} as TimeTracking_NearbyCustomersEdge : aTimeTracking_NearbyCustomersEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_NearbyCustomersEdge = (overrides?: Partial<TimeTracking_NearbyCustomersEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_NearbyCustomersEdge' } & TimeTracking_NearbyCustomersEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_NearbyCustomersEdge');
    return {
        __typename: 'TimeTracking_NearbyCustomersEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'hic',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_NearbyCustomersNode') ? {} as TimeTracking_NearbyCustomersNode : aTimeTracking_NearbyCustomersNode({}, relationshipsToOmit),
    };
};

export const aTimeTracking_NearbyCustomersInput = (overrides?: Partial<TimeTracking_NearbyCustomersInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_NearbyCustomersInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_NearbyCustomersInput');
    return {
        latitude: overrides && overrides.hasOwnProperty('latitude') ? overrides.latitude! : 'ut',
        longitude: overrides && overrides.hasOwnProperty('longitude') ? overrides.longitude! : 'qui',
        radiusInMeters: overrides && overrides.hasOwnProperty('radiusInMeters') ? overrides.radiusInMeters! : 7877,
        timeFor: overrides && overrides.hasOwnProperty('timeFor') ? overrides.timeFor! : relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_NearbyCustomersNode = (overrides?: Partial<TimeTracking_NearbyCustomersNode>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_NearbyCustomersNode' } & TimeTracking_NearbyCustomersNode => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_NearbyCustomersNode');
    return {
        __typename: 'TimeTracking_NearbyCustomersNode',
        distanceInMeters: overrides && overrides.hasOwnProperty('distanceInMeters') ? overrides.distanceInMeters! : 5784,
        latitude: overrides && overrides.hasOwnProperty('latitude') ? overrides.latitude! : 'voluptatem',
        longitude: overrides && overrides.hasOwnProperty('longitude') ? overrides.longitude! : 'quos',
        timeAgainstContactDAS: overrides && overrides.hasOwnProperty('timeAgainstContactDAS') ? overrides.timeAgainstContactDAS! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainstContact') ? {} as TimeTracking_TrackTimeAgainstContact : aTimeTracking_TrackTimeAgainstContact({}, relationshipsToOmit),
    };
};

export const aTimeTracking_NotificationEmployerSettings = (overrides?: Partial<TimeTracking_NotificationEmployerSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_NotificationEmployerSettings' } & TimeTracking_NotificationEmployerSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_NotificationEmployerSettings');
    return {
        __typename: 'TimeTracking_NotificationEmployerSettings',
        clockOutOverrideNotifications: overrides && overrides.hasOwnProperty('clockOutOverrideNotifications') ? overrides.clockOutOverrideNotifications! : relationshipsToOmit.has('TimeTracking_ClockOutOverrideNotificationSettings') ? {} as TimeTracking_ClockOutOverrideNotificationSettings : aTimeTracking_ClockOutOverrideNotificationSettings({}, relationshipsToOmit),
        endShiftNotifications: overrides && overrides.hasOwnProperty('endShiftNotifications') ? overrides.endShiftNotifications! : relationshipsToOmit.has('TimeTracking_ShiftNotificationSettings') ? {} as TimeTracking_ShiftNotificationSettings : aTimeTracking_ShiftNotificationSettings({}, relationshipsToOmit),
        notificationEnabledForDays: overrides && overrides.hasOwnProperty('notificationEnabledForDays') ? overrides.notificationEnabledForDays! : relationshipsToOmit.has('TimeTracking_SettingNotificationReminderDays') ? {} as TimeTracking_SettingNotificationReminderDays : aTimeTracking_SettingNotificationReminderDays({}, relationshipsToOmit),
        overtimeNotifications: overrides && overrides.hasOwnProperty('overtimeNotifications') ? overrides.overtimeNotifications! : relationshipsToOmit.has('TimeTracking_OvertimeNotificationSettings') ? {} as TimeTracking_OvertimeNotificationSettings : aTimeTracking_OvertimeNotificationSettings({}, relationshipsToOmit),
        scheduleNotifications: overrides && overrides.hasOwnProperty('scheduleNotifications') ? overrides.scheduleNotifications! : relationshipsToOmit.has('TimeTracking_ScheduleNotificationSettings') ? {} as TimeTracking_ScheduleNotificationSettings : aTimeTracking_ScheduleNotificationSettings({}, relationshipsToOmit),
        startShiftNotifications: overrides && overrides.hasOwnProperty('startShiftNotifications') ? overrides.startShiftNotifications! : relationshipsToOmit.has('TimeTracking_ShiftNotificationSettings') ? {} as TimeTracking_ShiftNotificationSettings : aTimeTracking_ShiftNotificationSettings({}, relationshipsToOmit),
        timesheetEditNotifications: overrides && overrides.hasOwnProperty('timesheetEditNotifications') ? overrides.timesheetEditNotifications! : relationshipsToOmit.has('TimeTracking_TimesheetEditNotificationSettings') ? {} as TimeTracking_TimesheetEditNotificationSettings : aTimeTracking_TimesheetEditNotificationSettings({}, relationshipsToOmit),
    };
};

export const aTimeTracking_NotificationEmployerSettingsInput = (overrides?: Partial<TimeTracking_NotificationEmployerSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_NotificationEmployerSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_NotificationEmployerSettingsInput');
    return {
        clockOutOverrideNotifications: overrides && overrides.hasOwnProperty('clockOutOverrideNotifications') ? overrides.clockOutOverrideNotifications! : relationshipsToOmit.has('TimeTracking_UpdateClockOutOverrideNotificationSettingsInput') ? {} as TimeTracking_UpdateClockOutOverrideNotificationSettingsInput : aTimeTracking_UpdateClockOutOverrideNotificationSettingsInput({}, relationshipsToOmit),
        endShiftNotifications: overrides && overrides.hasOwnProperty('endShiftNotifications') ? overrides.endShiftNotifications! : relationshipsToOmit.has('TimeTracking_UpdateShiftNotificationSettingsInput') ? {} as TimeTracking_UpdateShiftNotificationSettingsInput : aTimeTracking_UpdateShiftNotificationSettingsInput({}, relationshipsToOmit),
        notificationEnabledForDays: overrides && overrides.hasOwnProperty('notificationEnabledForDays') ? overrides.notificationEnabledForDays! : relationshipsToOmit.has('TimeTracking_UpdateSettingNotificationReminderDaysInput') ? {} as TimeTracking_UpdateSettingNotificationReminderDaysInput : aTimeTracking_UpdateSettingNotificationReminderDaysInput({}, relationshipsToOmit),
        overtimeNotifications: overrides && overrides.hasOwnProperty('overtimeNotifications') ? overrides.overtimeNotifications! : relationshipsToOmit.has('TimeTracking_UpdateOvertimeNotificationSettingsInput') ? {} as TimeTracking_UpdateOvertimeNotificationSettingsInput : aTimeTracking_UpdateOvertimeNotificationSettingsInput({}, relationshipsToOmit),
        scheduleNotifications: overrides && overrides.hasOwnProperty('scheduleNotifications') ? overrides.scheduleNotifications! : relationshipsToOmit.has('TimeTracking_UpdateScheduleNotificationSettingsInput') ? {} as TimeTracking_UpdateScheduleNotificationSettingsInput : aTimeTracking_UpdateScheduleNotificationSettingsInput({}, relationshipsToOmit),
        startShiftNotifications: overrides && overrides.hasOwnProperty('startShiftNotifications') ? overrides.startShiftNotifications! : relationshipsToOmit.has('TimeTracking_UpdateShiftNotificationSettingsInput') ? {} as TimeTracking_UpdateShiftNotificationSettingsInput : aTimeTracking_UpdateShiftNotificationSettingsInput({}, relationshipsToOmit),
        timesheetEditNotifications: overrides && overrides.hasOwnProperty('timesheetEditNotifications') ? overrides.timesheetEditNotifications! : relationshipsToOmit.has('TimeTracking_UpdateTimeSheetEditNotificationSettingsInput') ? {} as TimeTracking_UpdateTimeSheetEditNotificationSettingsInput : aTimeTracking_UpdateTimeSheetEditNotificationSettingsInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_NotificationSubscription = (overrides?: Partial<TimeTracking_NotificationSubscription>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_NotificationSubscription' } & TimeTracking_NotificationSubscription => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_NotificationSubscription');
    return {
        __typename: 'TimeTracking_NotificationSubscription',
        distributionMethods: overrides && overrides.hasOwnProperty('distributionMethods') ? overrides.distributionMethods! : [TimeTracking_NotificationReminderMedium.Email],
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        notificationType: overrides && overrides.hasOwnProperty('notificationType') ? overrides.notificationType! : TimeTracking_NotificationType.ShiftEndAfter,
    };
};

export const aTimeTracking_NotificationSubscriptionInput = (overrides?: Partial<TimeTracking_NotificationSubscriptionInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_NotificationSubscriptionInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_NotificationSubscriptionInput');
    return {
        distributionMethods: overrides && overrides.hasOwnProperty('distributionMethods') ? overrides.distributionMethods! : [TimeTracking_NotificationReminderMedium.Email],
        notificationType: overrides && overrides.hasOwnProperty('notificationType') ? overrides.notificationType! : TimeTracking_NotificationType.ShiftEndAfter,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'repudiandae',
    };
};

export const aTimeTracking_OvertimeAlertFrequency = (overrides?: Partial<TimeTracking_OvertimeAlertFrequency>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_OvertimeAlertFrequency' } & TimeTracking_OvertimeAlertFrequency => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_OvertimeAlertFrequency');
    return {
        __typename: 'TimeTracking_OvertimeAlertFrequency',
        intervalMinutes: overrides && overrides.hasOwnProperty('intervalMinutes') ? overrides.intervalMinutes! : 1583,
        totalAlerts: overrides && overrides.hasOwnProperty('totalAlerts') ? overrides.totalAlerts! : 5790,
    };
};

export const aTimeTracking_OvertimeAlertFrequencyInput = (overrides?: Partial<TimeTracking_OvertimeAlertFrequencyInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_OvertimeAlertFrequencyInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_OvertimeAlertFrequencyInput');
    return {
        intervalMinutes: overrides && overrides.hasOwnProperty('intervalMinutes') ? overrides.intervalMinutes! : 5673,
        totalAlerts: overrides && overrides.hasOwnProperty('totalAlerts') ? overrides.totalAlerts! : 1507,
    };
};

export const aTimeTracking_OvertimeAlertRecipients = (overrides?: Partial<TimeTracking_OvertimeAlertRecipients>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_OvertimeAlertRecipients' } & TimeTracking_OvertimeAlertRecipients => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_OvertimeAlertRecipients');
    return {
        __typename: 'TimeTracking_OvertimeAlertRecipients',
        admin: overrides && overrides.hasOwnProperty('admin') ? overrides.admin! : [TimeTracking_NotificationReminderMedium.Email],
        employee: overrides && overrides.hasOwnProperty('employee') ? overrides.employee! : [TimeTracking_NotificationReminderMedium.Email],
        groupManager: overrides && overrides.hasOwnProperty('groupManager') ? overrides.groupManager! : [TimeTracking_NotificationReminderMedium.Email],
    };
};

export const aTimeTracking_OvertimeAlertRecipientsInput = (overrides?: Partial<TimeTracking_OvertimeAlertRecipientsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_OvertimeAlertRecipientsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_OvertimeAlertRecipientsInput');
    return {
        admin: overrides && overrides.hasOwnProperty('admin') ? overrides.admin! : [TimeTracking_NotificationReminderMedium.Email],
        employee: overrides && overrides.hasOwnProperty('employee') ? overrides.employee! : [TimeTracking_NotificationReminderMedium.Email],
        groupManager: overrides && overrides.hasOwnProperty('groupManager') ? overrides.groupManager! : [TimeTracking_NotificationReminderMedium.Email],
    };
};

export const aTimeTracking_OvertimeNotificationRule = (overrides?: Partial<TimeTracking_OvertimeNotificationRule>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_OvertimeNotificationRule' } & TimeTracking_OvertimeNotificationRule => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_OvertimeNotificationRule');
    return {
        __typename: 'TimeTracking_OvertimeNotificationRule',
        alertFrequency: overrides && overrides.hasOwnProperty('alertFrequency') ? overrides.alertFrequency! : relationshipsToOmit.has('TimeTracking_OvertimeAlertFrequency') ? {} as TimeTracking_OvertimeAlertFrequency : aTimeTracking_OvertimeAlertFrequency({}, relationshipsToOmit),
        assignedTo: overrides && overrides.hasOwnProperty('assignedTo') ? overrides.assignedTo! : relationshipsToOmit.has('TimeTracking_OvertimeRuleAssignment') ? {} as TimeTracking_OvertimeRuleAssignment : aTimeTracking_OvertimeRuleAssignment({}, relationshipsToOmit),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '6327c6aa-a3e5-423b-af35-5988a0335563',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        recipients: overrides && overrides.hasOwnProperty('recipients') ? overrides.recipients! : relationshipsToOmit.has('TimeTracking_OvertimeAlertRecipients') ? {} as TimeTracking_OvertimeAlertRecipients : aTimeTracking_OvertimeAlertRecipients({}, relationshipsToOmit),
        threshold: overrides && overrides.hasOwnProperty('threshold') ? overrides.threshold! : relationshipsToOmit.has('TimeTracking_OvertimeThreshold') ? {} as TimeTracking_OvertimeThreshold : aTimeTracking_OvertimeThreshold({}, relationshipsToOmit),
    };
};

export const aTimeTracking_OvertimeNotificationSettings = (overrides?: Partial<TimeTracking_OvertimeNotificationSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_OvertimeNotificationSettings' } & TimeTracking_OvertimeNotificationSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_OvertimeNotificationSettings');
    return {
        __typename: 'TimeTracking_OvertimeNotificationSettings',
        rules: overrides && overrides.hasOwnProperty('rules') ? overrides.rules! : [relationshipsToOmit.has('TimeTracking_OvertimeNotificationRule') ? {} as TimeTracking_OvertimeNotificationRule : aTimeTracking_OvertimeNotificationRule({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_OvertimeRuleAssignment = (overrides?: Partial<TimeTracking_OvertimeRuleAssignment>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_OvertimeRuleAssignment' } & TimeTracking_OvertimeRuleAssignment => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_OvertimeRuleAssignment');
    return {
        __typename: 'TimeTracking_OvertimeRuleAssignment',
        entityIds: overrides && overrides.hasOwnProperty('entityIds') ? overrides.entityIds! : '4f1d798c-dfc0-4700-bbbd-be7e55cd3d00',
        entityType: overrides && overrides.hasOwnProperty('entityType') ? overrides.entityType! : TimeTracking_OvertimeRuleEntityType.All,
    };
};

export const aTimeTracking_OvertimeThreshold = (overrides?: Partial<TimeTracking_OvertimeThreshold>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_OvertimeThreshold' } & TimeTracking_OvertimeThreshold => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_OvertimeThreshold');
    return {
        __typename: 'TimeTracking_OvertimeThreshold',
        hours: overrides && overrides.hasOwnProperty('hours') ? overrides.hours! : 4632,
        minutes: overrides && overrides.hasOwnProperty('minutes') ? overrides.minutes! : 4125,
        period: overrides && overrides.hasOwnProperty('period') ? overrides.period! : TimeTracking_OvertimePeriod.Day,
    };
};

export const aTimeTracking_OvertimeThresholdInput = (overrides?: Partial<TimeTracking_OvertimeThresholdInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_OvertimeThresholdInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_OvertimeThresholdInput');
    return {
        hours: overrides && overrides.hasOwnProperty('hours') ? overrides.hours! : 5514,
        minutes: overrides && overrides.hasOwnProperty('minutes') ? overrides.minutes! : 508,
        period: overrides && overrides.hasOwnProperty('period') ? overrides.period! : TimeTracking_OvertimePeriod.Day,
    };
};

export const aTimeTracking_PageMeta = (overrides?: Partial<TimeTracking_PageMeta>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PageMeta' } & TimeTracking_PageMeta => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PageMeta');
    return {
        __typename: 'TimeTracking_PageMeta',
        currentPageDisplay: overrides && overrides.hasOwnProperty('currentPageDisplay') ? overrides.currentPageDisplay! : 2973,
        currentPageNumber: overrides && overrides.hasOwnProperty('currentPageNumber') ? overrides.currentPageNumber! : 5602,
        hasNext: overrides && overrides.hasOwnProperty('hasNext') ? overrides.hasNext! : true,
        hasPrevious: overrides && overrides.hasOwnProperty('hasPrevious') ? overrides.hasPrevious! : true,
        isEmpty: overrides && overrides.hasOwnProperty('isEmpty') ? overrides.isEmpty! : true,
        isFirst: overrides && overrides.hasOwnProperty('isFirst') ? overrides.isFirst! : true,
        isLast: overrides && overrides.hasOwnProperty('isLast') ? overrides.isLast! : false,
        itemsOnPage: overrides && overrides.hasOwnProperty('itemsOnPage') ? overrides.itemsOnPage! : 6357,
        orderBy: overrides && overrides.hasOwnProperty('orderBy') ? overrides.orderBy! : [TimeTracking_CustomerTimeSummaryOrderBy.TotalBillableDurationSecondsAsc],
        pageSize: overrides && overrides.hasOwnProperty('pageSize') ? overrides.pageSize! : 1860,
        showingFrom: overrides && overrides.hasOwnProperty('showingFrom') ? overrides.showingFrom! : 7466,
        showingTo: overrides && overrides.hasOwnProperty('showingTo') ? overrides.showingTo! : 1654,
        totalCount: overrides && overrides.hasOwnProperty('totalCount') ? overrides.totalCount! : 'voluptas',
        totalPages: overrides && overrides.hasOwnProperty('totalPages') ? overrides.totalPages! : 9897,
    };
};

export const aTimeTracking_PartialBatchManageTimeEntriesPayload = (overrides?: Partial<TimeTracking_PartialBatchManageTimeEntriesPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PartialBatchManageTimeEntriesPayload' } & TimeTracking_PartialBatchManageTimeEntriesPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PartialBatchManageTimeEntriesPayload');
    return {
        __typename: 'TimeTracking_PartialBatchManageTimeEntriesPayload',
        deletes: overrides && overrides.hasOwnProperty('deletes') ? overrides.deletes! : ['196a38ad-9165-4fb9-a36c-6fc7d9f12fa0'],
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'magni',
        timeEntries: overrides && overrides.hasOwnProperty('timeEntries') ? overrides.timeEntries! : [relationshipsToOmit.has('TimeTracking_TimeEntry') ? {} as TimeTracking_TimeEntry : aTimeTracking_TimeEntry({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_PartialCustomFieldAssignmentPayload = (overrides?: Partial<TimeTracking_PartialCustomFieldAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PartialCustomFieldAssignmentPayload' } & TimeTracking_PartialCustomFieldAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PartialCustomFieldAssignmentPayload');
    return {
        __typename: 'TimeTracking_PartialCustomFieldAssignmentPayload',
        assignResults: overrides && overrides.hasOwnProperty('assignResults') ? overrides.assignResults! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
        customField: overrides && overrides.hasOwnProperty('customField') ? overrides.customField! : relationshipsToOmit.has('AppFoundations_CustomFieldDefinition') ? {} as AppFoundations_CustomFieldDefinition : anAppFoundations_CustomFieldDefinition({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'tempora',
        unassignResults: overrides && overrides.hasOwnProperty('unassignResults') ? overrides.unassignResults! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_PartialCustomFieldOptionAssignmentPayload = (overrides?: Partial<TimeTracking_PartialCustomFieldOptionAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PartialCustomFieldOptionAssignmentPayload' } & TimeTracking_PartialCustomFieldOptionAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PartialCustomFieldOptionAssignmentPayload');
    return {
        __typename: 'TimeTracking_PartialCustomFieldOptionAssignmentPayload',
        customFieldOption: overrides && overrides.hasOwnProperty('customFieldOption') ? overrides.customFieldOption! : relationshipsToOmit.has('TimeTracking_CustomFieldOption') ? {} as TimeTracking_CustomFieldOption : aTimeTracking_CustomFieldOption({}, relationshipsToOmit),
        groupAssignResults: overrides && overrides.hasOwnProperty('groupAssignResults') ? overrides.groupAssignResults! : [relationshipsToOmit.has('TimeTracking_AssignedGroup') ? {} as TimeTracking_AssignedGroup : aTimeTracking_AssignedGroup({}, relationshipsToOmit)],
        groupUnassignResults: overrides && overrides.hasOwnProperty('groupUnassignResults') ? overrides.groupUnassignResults! : [relationshipsToOmit.has('TimeTracking_AssignedGroup') ? {} as TimeTracking_AssignedGroup : aTimeTracking_AssignedGroup({}, relationshipsToOmit)],
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'aliquid',
        timeForAssignResults: overrides && overrides.hasOwnProperty('timeForAssignResults') ? overrides.timeForAssignResults! : [relationshipsToOmit.has('TimeTracking_AssignedWorker') ? {} as TimeTracking_AssignedWorker : aTimeTracking_AssignedWorker({}, relationshipsToOmit)],
        timeForUnassignResults: overrides && overrides.hasOwnProperty('timeForUnassignResults') ? overrides.timeForUnassignResults! : [relationshipsToOmit.has('TimeTracking_AssignedWorker') ? {} as TimeTracking_AssignedWorker : aTimeTracking_AssignedWorker({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload = (overrides?: Partial<TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload' } & TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload');
    return {
        __typename: 'TimeTracking_PartialCustomFieldOptionTimeAgainstAssignmentPayload',
        customFieldOption: overrides && overrides.hasOwnProperty('customFieldOption') ? overrides.customFieldOption! : relationshipsToOmit.has('TimeTracking_CustomFieldOption') ? {} as TimeTracking_CustomFieldOption : aTimeTracking_CustomFieldOption({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'eos',
        timeAgainstAssignResults: overrides && overrides.hasOwnProperty('timeAgainstAssignResults') ? overrides.timeAgainstAssignResults! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
        timeAgainstUnassignResults: overrides && overrides.hasOwnProperty('timeAgainstUnassignResults') ? overrides.timeAgainstUnassignResults! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_PartialStandardFieldAssignmentPayload = (overrides?: Partial<TimeTracking_PartialStandardFieldAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PartialStandardFieldAssignmentPayload' } & TimeTracking_PartialStandardFieldAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PartialStandardFieldAssignmentPayload');
    return {
        __typename: 'TimeTracking_PartialStandardFieldAssignmentPayload',
        assignResults: overrides && overrides.hasOwnProperty('assignResults') ? overrides.assignResults! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'ipsum',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'porro',
        unassignResults: overrides && overrides.hasOwnProperty('unassignResults') ? overrides.unassignResults! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload = (overrides?: Partial<TimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload' } & TimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload');
    return {
        __typename: 'TimeTracking_PartialStandardFieldOptionTimeAgainstAssignmentPayload',
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'consequatur',
        standardFieldOptionId: overrides && overrides.hasOwnProperty('standardFieldOptionId') ? overrides.standardFieldOptionId! : '3e62fa12-e2f8-4ab6-8d22-e2668e6abf85',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'nam',
        timeAgainstAssignResults: overrides && overrides.hasOwnProperty('timeAgainstAssignResults') ? overrides.timeAgainstAssignResults! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
        timeAgainstUnassignResults: overrides && overrides.hasOwnProperty('timeAgainstUnassignResults') ? overrides.timeAgainstUnassignResults! : [relationshipsToOmit.has('TimeTracking_AssignedCustomer') ? {} as TimeTracking_AssignedCustomer : aTimeTracking_AssignedCustomer({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_PartialStandardFieldOptionTimeForAssignmentPayload = (overrides?: Partial<TimeTracking_PartialStandardFieldOptionTimeForAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PartialStandardFieldOptionTimeForAssignmentPayload' } & TimeTracking_PartialStandardFieldOptionTimeForAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PartialStandardFieldOptionTimeForAssignmentPayload');
    return {
        __typename: 'TimeTracking_PartialStandardFieldOptionTimeForAssignmentPayload',
        groupAssignResults: overrides && overrides.hasOwnProperty('groupAssignResults') ? overrides.groupAssignResults! : [relationshipsToOmit.has('TimeTracking_AssignedGroup') ? {} as TimeTracking_AssignedGroup : aTimeTracking_AssignedGroup({}, relationshipsToOmit)],
        groupUnassignResults: overrides && overrides.hasOwnProperty('groupUnassignResults') ? overrides.groupUnassignResults! : [relationshipsToOmit.has('TimeTracking_AssignedGroup') ? {} as TimeTracking_AssignedGroup : aTimeTracking_AssignedGroup({}, relationshipsToOmit)],
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'placeat',
        standardFieldOptionId: overrides && overrides.hasOwnProperty('standardFieldOptionId') ? overrides.standardFieldOptionId! : 'a0626522-65e5-4693-8004-d3170525900a',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'voluptatem',
        timeForAssignResults: overrides && overrides.hasOwnProperty('timeForAssignResults') ? overrides.timeForAssignResults! : [relationshipsToOmit.has('TimeTracking_AssignedWorker') ? {} as TimeTracking_AssignedWorker : aTimeTracking_AssignedWorker({}, relationshipsToOmit)],
        timeForUnassignResults: overrides && overrides.hasOwnProperty('timeForUnassignResults') ? overrides.timeForUnassignResults! : [relationshipsToOmit.has('TimeTracking_AssignedWorker') ? {} as TimeTracking_AssignedWorker : aTimeTracking_AssignedWorker({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_PartialTimeAgainstCustomFieldAssignmentPayload = (overrides?: Partial<TimeTracking_PartialTimeAgainstCustomFieldAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PartialTimeAgainstCustomFieldAssignmentPayload' } & TimeTracking_PartialTimeAgainstCustomFieldAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PartialTimeAgainstCustomFieldAssignmentPayload');
    return {
        __typename: 'TimeTracking_PartialTimeAgainstCustomFieldAssignmentPayload',
        assignResults: overrides && overrides.hasOwnProperty('assignResults') ? overrides.assignResults! : [relationshipsToOmit.has('AppFoundations_CustomFieldDefinition') ? {} as AppFoundations_CustomFieldDefinition : anAppFoundations_CustomFieldDefinition({}, relationshipsToOmit)],
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'iure',
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainst') ? {} as TimeTracking_TrackTimeAgainst : aTimeTracking_TrackTimeAgainst({}, relationshipsToOmit),
        unassignResults: overrides && overrides.hasOwnProperty('unassignResults') ? overrides.unassignResults! : [relationshipsToOmit.has('AppFoundations_CustomFieldDefinition') ? {} as AppFoundations_CustomFieldDefinition : anAppFoundations_CustomFieldDefinition({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_PartialTimeAgainstFieldAssignmentPayload = (overrides?: Partial<TimeTracking_PartialTimeAgainstFieldAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PartialTimeAgainstFieldAssignmentPayload' } & TimeTracking_PartialTimeAgainstFieldAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PartialTimeAgainstFieldAssignmentPayload');
    return {
        __typename: 'TimeTracking_PartialTimeAgainstFieldAssignmentPayload',
        customFieldResult: overrides && overrides.hasOwnProperty('customFieldResult') ? overrides.customFieldResult! : relationshipsToOmit.has('TimeTracking_ManageTimeAgainstCustomFieldAssignmentError') ? {} as TimeTracking_ManageTimeAgainstCustomFieldAssignmentError : aTimeTracking_ManageTimeAgainstCustomFieldAssignmentError({}, relationshipsToOmit),
        standardFieldResult: overrides && overrides.hasOwnProperty('standardFieldResult') ? overrides.standardFieldResult! : relationshipsToOmit.has('TimeTracking_ManageTimeAgainstStandardFieldAssignmentError') ? {} as TimeTracking_ManageTimeAgainstStandardFieldAssignmentError : aTimeTracking_ManageTimeAgainstStandardFieldAssignmentError({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'reiciendis',
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainst') ? {} as TimeTracking_TrackTimeAgainst : aTimeTracking_TrackTimeAgainst({}, relationshipsToOmit),
        timeAgainstList: overrides && overrides.hasOwnProperty('timeAgainstList') ? overrides.timeAgainstList! : [relationshipsToOmit.has('TimeTracking_TrackTimeAgainst') ? {} as TimeTracking_TrackTimeAgainst : aTimeTracking_TrackTimeAgainst({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_PartialTimeAgainstStandardFieldAssignmentPayload = (overrides?: Partial<TimeTracking_PartialTimeAgainstStandardFieldAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PartialTimeAgainstStandardFieldAssignmentPayload' } & TimeTracking_PartialTimeAgainstStandardFieldAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PartialTimeAgainstStandardFieldAssignmentPayload');
    return {
        __typename: 'TimeTracking_PartialTimeAgainstStandardFieldAssignmentPayload',
        assignResults: overrides && overrides.hasOwnProperty('assignResults') ? overrides.assignResults! : [relationshipsToOmit.has('TimeTracking_AssignedStandardField') ? {} as TimeTracking_AssignedStandardField : aTimeTracking_AssignedStandardField({}, relationshipsToOmit)],
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'in',
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainst') ? {} as TimeTracking_TrackTimeAgainst : aTimeTracking_TrackTimeAgainst({}, relationshipsToOmit),
        unassignResults: overrides && overrides.hasOwnProperty('unassignResults') ? overrides.unassignResults! : [relationshipsToOmit.has('TimeTracking_AssignedStandardField') ? {} as TimeTracking_AssignedStandardField : aTimeTracking_AssignedStandardField({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_PartialTimeAgainstTimeForAssignmentPayload = (overrides?: Partial<TimeTracking_PartialTimeAgainstTimeForAssignmentPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PartialTimeAgainstTimeForAssignmentPayload' } & TimeTracking_PartialTimeAgainstTimeForAssignmentPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PartialTimeAgainstTimeForAssignmentPayload');
    return {
        __typename: 'TimeTracking_PartialTimeAgainstTimeForAssignmentPayload',
        groupAssignResults: overrides && overrides.hasOwnProperty('groupAssignResults') ? overrides.groupAssignResults! : [relationshipsToOmit.has('TimeTracking_AssignedGroup') ? {} as TimeTracking_AssignedGroup : aTimeTracking_AssignedGroup({}, relationshipsToOmit)],
        groupUnassignResults: overrides && overrides.hasOwnProperty('groupUnassignResults') ? overrides.groupUnassignResults! : [relationshipsToOmit.has('TimeTracking_AssignedGroup') ? {} as TimeTracking_AssignedGroup : aTimeTracking_AssignedGroup({}, relationshipsToOmit)],
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'quia',
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainst') ? {} as TimeTracking_TrackTimeAgainst : aTimeTracking_TrackTimeAgainst({}, relationshipsToOmit),
        timeAgainstList: overrides && overrides.hasOwnProperty('timeAgainstList') ? overrides.timeAgainstList! : [relationshipsToOmit.has('TimeTracking_TrackTimeAgainst') ? {} as TimeTracking_TrackTimeAgainst : aTimeTracking_TrackTimeAgainst({}, relationshipsToOmit)],
        timeForAssignResults: overrides && overrides.hasOwnProperty('timeForAssignResults') ? overrides.timeForAssignResults! : [relationshipsToOmit.has('TimeTracking_AssignedWorker') ? {} as TimeTracking_AssignedWorker : aTimeTracking_AssignedWorker({}, relationshipsToOmit)],
        timeForUnassignResults: overrides && overrides.hasOwnProperty('timeForUnassignResults') ? overrides.timeForUnassignResults! : [relationshipsToOmit.has('TimeTracking_AssignedWorker') ? {} as TimeTracking_AssignedWorker : aTimeTracking_AssignedWorker({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_PayPeriodApprovalReminder = (overrides?: Partial<TimeTracking_PayPeriodApprovalReminder>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PayPeriodApprovalReminder' } & TimeTracking_PayPeriodApprovalReminder => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PayPeriodApprovalReminder');
    return {
        __typename: 'TimeTracking_PayPeriodApprovalReminder',
        currentPeriodReminder: overrides && overrides.hasOwnProperty('currentPeriodReminder') ? overrides.currentPeriodReminder! : relationshipsToOmit.has('TimeTracking_PayPeriodApprovalReminderDetails') ? {} as TimeTracking_PayPeriodApprovalReminderDetails : aTimeTracking_PayPeriodApprovalReminderDetails({}, relationshipsToOmit),
        previousPeriodReminder: overrides && overrides.hasOwnProperty('previousPeriodReminder') ? overrides.previousPeriodReminder! : relationshipsToOmit.has('TimeTracking_PayPeriodApprovalReminderDetails') ? {} as TimeTracking_PayPeriodApprovalReminderDetails : aTimeTracking_PayPeriodApprovalReminderDetails({}, relationshipsToOmit),
    };
};

export const aTimeTracking_PayPeriodApprovalReminderDetails = (overrides?: Partial<TimeTracking_PayPeriodApprovalReminderDetails>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PayPeriodApprovalReminderDetails' } & TimeTracking_PayPeriodApprovalReminderDetails => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PayPeriodApprovalReminderDetails');
    return {
        __typename: 'TimeTracking_PayPeriodApprovalReminderDetails',
        hour: overrides && overrides.hasOwnProperty('hour') ? overrides.hour! : relationshipsToOmit.has('TimeTracking_SettingInteger') ? {} as TimeTracking_SettingInteger : aTimeTracking_SettingInteger({}, relationshipsToOmit),
        offsetDays: overrides && overrides.hasOwnProperty('offsetDays') ? overrides.offsetDays! : relationshipsToOmit.has('TimeTracking_SettingInteger') ? {} as TimeTracking_SettingInteger : aTimeTracking_SettingInteger({}, relationshipsToOmit),
        reminderMedium: overrides && overrides.hasOwnProperty('reminderMedium') ? overrides.reminderMedium! : relationshipsToOmit.has('TimeTracking_SettingNotificationMedium') ? {} as TimeTracking_SettingNotificationMedium : aTimeTracking_SettingNotificationMedium({}, relationshipsToOmit),
    };
};

export const aTimeTracking_PayPeriodApprovalReminderDetailsInput = (overrides?: Partial<TimeTracking_PayPeriodApprovalReminderDetailsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_PayPeriodApprovalReminderDetailsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PayPeriodApprovalReminderDetailsInput');
    return {
        hour: overrides && overrides.hasOwnProperty('hour') ? overrides.hour! : relationshipsToOmit.has('TimeTracking_UpdateSettingIntegerInput') ? {} as TimeTracking_UpdateSettingIntegerInput : aTimeTracking_UpdateSettingIntegerInput({}, relationshipsToOmit),
        offsetDays: overrides && overrides.hasOwnProperty('offsetDays') ? overrides.offsetDays! : relationshipsToOmit.has('TimeTracking_UpdateSettingIntegerInput') ? {} as TimeTracking_UpdateSettingIntegerInput : aTimeTracking_UpdateSettingIntegerInput({}, relationshipsToOmit),
        reminderMedium: overrides && overrides.hasOwnProperty('reminderMedium') ? overrides.reminderMedium! : relationshipsToOmit.has('TimeTracking_UpdateSettingApprovalReminderMediumInput') ? {} as TimeTracking_UpdateSettingApprovalReminderMediumInput : aTimeTracking_UpdateSettingApprovalReminderMediumInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_PayPeriodApprovalReminderInput = (overrides?: Partial<TimeTracking_PayPeriodApprovalReminderInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_PayPeriodApprovalReminderInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PayPeriodApprovalReminderInput');
    return {
        currentPeriodReminder: overrides && overrides.hasOwnProperty('currentPeriodReminder') ? overrides.currentPeriodReminder! : relationshipsToOmit.has('TimeTracking_PayPeriodApprovalReminderDetailsInput') ? {} as TimeTracking_PayPeriodApprovalReminderDetailsInput : aTimeTracking_PayPeriodApprovalReminderDetailsInput({}, relationshipsToOmit),
        previousPeriodReminder: overrides && overrides.hasOwnProperty('previousPeriodReminder') ? overrides.previousPeriodReminder! : relationshipsToOmit.has('TimeTracking_PayPeriodApprovalReminderDetailsInput') ? {} as TimeTracking_PayPeriodApprovalReminderDetailsInput : aTimeTracking_PayPeriodApprovalReminderDetailsInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_PayrollEmployeeCompensationBreakdownByTags = (overrides?: Partial<TimeTracking_PayrollEmployeeCompensationBreakdownByTags>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PayrollEmployeeCompensationBreakdownByTags' } & TimeTracking_PayrollEmployeeCompensationBreakdownByTags => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PayrollEmployeeCompensationBreakdownByTags');
    return {
        __typename: 'TimeTracking_PayrollEmployeeCompensationBreakdownByTags',
        seconds: overrides && overrides.hasOwnProperty('seconds') ? overrides.seconds! : 1644,
        tags: overrides && overrides.hasOwnProperty('tags') ? overrides.tags! : [relationshipsToOmit.has('AppFoundations_CustomDimensionValue') ? {} as AppFoundations_CustomDimensionValue : anAppFoundations_CustomDimensionValue({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_PayrollEmployeeCompensationDetails = (overrides?: Partial<TimeTracking_PayrollEmployeeCompensationDetails>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PayrollEmployeeCompensationDetails' } & TimeTracking_PayrollEmployeeCompensationDetails => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PayrollEmployeeCompensationDetails');
    return {
        __typename: 'TimeTracking_PayrollEmployeeCompensationDetails',
        employeeCompensation: overrides && overrides.hasOwnProperty('employeeCompensation') ? overrides.employeeCompensation! : relationshipsToOmit.has('Payroll_EmployeeCompensation') ? {} as Payroll_EmployeeCompensation : aPayroll_EmployeeCompensation({}, relationshipsToOmit),
        tagData: overrides && overrides.hasOwnProperty('tagData') ? overrides.tagData! : [relationshipsToOmit.has('TimeTracking_PayrollEmployeeCompensationBreakdownByTags') ? {} as TimeTracking_PayrollEmployeeCompensationBreakdownByTags : aTimeTracking_PayrollEmployeeCompensationBreakdownByTags({}, relationshipsToOmit)],
        totalSeconds: overrides && overrides.hasOwnProperty('totalSeconds') ? overrides.totalSeconds! : 7723,
    };
};

export const aTimeTracking_PayrollEmployeeData = (overrides?: Partial<TimeTracking_PayrollEmployeeData>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PayrollEmployeeData' } & TimeTracking_PayrollEmployeeData => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PayrollEmployeeData');
    return {
        __typename: 'TimeTracking_PayrollEmployeeData',
        compensationDetails: overrides && overrides.hasOwnProperty('compensationDetails') ? overrides.compensationDetails! : [relationshipsToOmit.has('TimeTracking_PayrollEmployeeCompensationDetails') ? {} as TimeTracking_PayrollEmployeeCompensationDetails : aTimeTracking_PayrollEmployeeCompensationDetails({}, relationshipsToOmit)],
        employee: overrides && overrides.hasOwnProperty('employee') ? overrides.employee! : relationshipsToOmit.has('WorkerManagement_Employee') ? {} as WorkerManagement_Employee : aWorkerManagement_Employee({}, relationshipsToOmit),
        isApproved: overrides && overrides.hasOwnProperty('isApproved') ? overrides.isApproved! : true,
    };
};

export const aTimeTracking_PayrollEmployeeDataConnection = (overrides?: Partial<TimeTracking_PayrollEmployeeDataConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PayrollEmployeeDataConnection' } & TimeTracking_PayrollEmployeeDataConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PayrollEmployeeDataConnection');
    return {
        __typename: 'TimeTracking_PayrollEmployeeDataConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_PayrollEmployeeDataEdge') ? {} as TimeTracking_PayrollEmployeeDataEdge : aTimeTracking_PayrollEmployeeDataEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_PayrollEmployeeDataEdge = (overrides?: Partial<TimeTracking_PayrollEmployeeDataEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PayrollEmployeeDataEdge' } & TimeTracking_PayrollEmployeeDataEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PayrollEmployeeDataEdge');
    return {
        __typename: 'TimeTracking_PayrollEmployeeDataEdge',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_PayrollEmployeeData') ? {} as TimeTracking_PayrollEmployeeData : aTimeTracking_PayrollEmployeeData({}, relationshipsToOmit),
    };
};

export const aTimeTracking_PayrollEmployeeDataInputFilter = (overrides?: Partial<TimeTracking_PayrollEmployeeDataInputFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_PayrollEmployeeDataInputFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PayrollEmployeeDataInputFilter');
    return {
        dateRange: overrides && overrides.hasOwnProperty('dateRange') ? overrides.dateRange! : relationshipsToOmit.has('TimeTracking_DatePeriod') ? {} as TimeTracking_DatePeriod : aTimeTracking_DatePeriod({}, relationshipsToOmit),
        employeeIds: overrides && overrides.hasOwnProperty('employeeIds') ? overrides.employeeIds! : ['8de58eda-db19-4256-8b6d-1771099b5f37'],
    };
};

export const aTimeTracking_Post = (overrides?: Partial<TimeTracking_Post>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_Post' } & TimeTracking_Post => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_Post');
    return {
        __typename: 'TimeTracking_Post',
        content: overrides && overrides.hasOwnProperty('content') ? overrides.content! : 'a',
        contentAttachments: overrides && overrides.hasOwnProperty('contentAttachments') ? overrides.contentAttachments! : [relationshipsToOmit.has('TimeTracking_ContentAttachment') ? {} as TimeTracking_ContentAttachment : aTimeTracking_ContentAttachment({}, relationshipsToOmit)],
        customerId: overrides && overrides.hasOwnProperty('customerId') ? overrides.customerId! : '407d4496-92fe-455f-b737-b7a747816fa0',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '059486fd-9772-463a-8d43-c8b520210c61',
        parentPostId: overrides && overrides.hasOwnProperty('parentPostId') ? overrides.parentPostId! : '0c673dec-990f-4c60-9be1-ba5d88418a5c',
        postMentions: overrides && overrides.hasOwnProperty('postMentions') ? overrides.postMentions! : [relationshipsToOmit.has('TimeTracking_PostMention') ? {} as TimeTracking_PostMention : aTimeTracking_PostMention({}, relationshipsToOmit)],
        postMeta: overrides && overrides.hasOwnProperty('postMeta') ? overrides.postMeta! : relationshipsToOmit.has('TimeTracking_PostMeta') ? {} as TimeTracking_PostMeta : aTimeTracking_PostMeta({}, relationshipsToOmit),
        postType: overrides && overrides.hasOwnProperty('postType') ? overrides.postType! : TimeTracking_PostType.Attachment,
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : 'de3b27b9-c99f-45c4-9e87-8f624ae376c0',
        replyCount: overrides && overrides.hasOwnProperty('replyCount') ? overrides.replyCount! : 3740,
        unreadReplyCount: overrides && overrides.hasOwnProperty('unreadReplyCount') ? overrides.unreadReplyCount! : 6218,
        worker: overrides && overrides.hasOwnProperty('worker') ? overrides.worker! : relationshipsToOmit.has('TimeTracking_Worker') ? {} as TimeTracking_Worker : aTimeTracking_Worker({}, relationshipsToOmit),
    };
};

export const aTimeTracking_PostMention = (overrides?: Partial<TimeTracking_PostMention>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PostMention' } & TimeTracking_PostMention => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PostMention');
    return {
        __typename: 'TimeTracking_PostMention',
        active: overrides && overrides.hasOwnProperty('active') ? overrides.active! : true,
        displayName: overrides && overrides.hasOwnProperty('displayName') ? overrides.displayName! : 'impedit',
        token: overrides && overrides.hasOwnProperty('token') ? overrides.token! : 'officia',
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : '35486ef3-be45-479b-9ca1-86d997f147aa',
    };
};

export const aTimeTracking_PostMeta = (overrides?: Partial<TimeTracking_PostMeta>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PostMeta' } & TimeTracking_PostMeta => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PostMeta');
    return {
        __typename: 'TimeTracking_PostMeta',
        createdAt: overrides && overrides.hasOwnProperty('createdAt') ? overrides.createdAt! : 'in',
        createdBy: overrides && overrides.hasOwnProperty('createdBy') ? overrides.createdBy! : 'et',
        updatedAt: overrides && overrides.hasOwnProperty('updatedAt') ? overrides.updatedAt! : 'aliquid',
        updatedBy: overrides && overrides.hasOwnProperty('updatedBy') ? overrides.updatedBy! : 'non',
    };
};

export const aTimeTracking_PostProjectRefsInput = (overrides?: Partial<TimeTracking_PostProjectRefsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_PostProjectRefsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PostProjectRefsInput');
    return {
        customerId: overrides && overrides.hasOwnProperty('customerId') ? overrides.customerId! : '450d5238-b5d4-473a-afa9-b8b06e2a6333',
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : '5668ac2b-eef2-4a78-899b-cdcee6703fd4',
    };
};

export const aTimeTracking_PostsConnection = (overrides?: Partial<TimeTracking_PostsConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PostsConnection' } & TimeTracking_PostsConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PostsConnection');
    return {
        __typename: 'TimeTracking_PostsConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_PostsEdge') ? {} as TimeTracking_PostsEdge : aTimeTracking_PostsEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
        totalCount: overrides && overrides.hasOwnProperty('totalCount') ? overrides.totalCount! : 1,
    };
};

export const aTimeTracking_PostsEdge = (overrides?: Partial<TimeTracking_PostsEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PostsEdge' } & TimeTracking_PostsEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PostsEdge');
    return {
        __typename: 'TimeTracking_PostsEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'quis',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_Post') ? {} as TimeTracking_Post : aTimeTracking_Post({}, relationshipsToOmit),
    };
};

export const aTimeTracking_PostsFilter = (overrides?: Partial<TimeTracking_PostsFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_PostsFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PostsFilter');
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'a323091e-d7e1-43d3-9353-43c772830c10',
        parentPostId: overrides && overrides.hasOwnProperty('parentPostId') ? overrides.parentPostId! : 'd1195951-5741-4af2-abfd-6ca8e16c89aa',
    };
};

export const aTimeTracking_PostsInput = (overrides?: Partial<TimeTracking_PostsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_PostsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PostsInput');
    return {
        projectRefs: overrides && overrides.hasOwnProperty('projectRefs') ? overrides.projectRefs! : relationshipsToOmit.has('TimeTracking_ProjectEstimateProjectRefInput') ? {} as TimeTracking_ProjectEstimateProjectRefInput : aTimeTracking_ProjectEstimateProjectRefInput({}, relationshipsToOmit),
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : 'ed81fb9c-2d00-4bce-9fd2-6478e2cec950',
    };
};

export const aTimeTracking_PostsUnreadCountInput = (overrides?: Partial<TimeTracking_PostsUnreadCountInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_PostsUnreadCountInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PostsUnreadCountInput');
    return {
        projectRefs: overrides && overrides.hasOwnProperty('projectRefs') ? overrides.projectRefs! : relationshipsToOmit.has('TimeTracking_ProjectEstimateProjectRefInput') ? {} as TimeTracking_ProjectEstimateProjectRefInput : aTimeTracking_ProjectEstimateProjectRefInput({}, relationshipsToOmit),
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : '5c967dae-83f6-40d8-8ea4-5ce939e5afa7',
    };
};

export const aTimeTracking_PostsUnreadCountResult = (overrides?: Partial<TimeTracking_PostsUnreadCountResult>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_PostsUnreadCountResult' } & TimeTracking_PostsUnreadCountResult => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_PostsUnreadCountResult');
    return {
        __typename: 'TimeTracking_PostsUnreadCountResult',
        customerId: overrides && overrides.hasOwnProperty('customerId') ? overrides.customerId! : '363a7a99-058f-4df6-8885-d9e2aa742af1',
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : '3673c60b-4728-4fcf-8071-083fe518849b',
        unreadCount: overrides && overrides.hasOwnProperty('unreadCount') ? overrides.unreadCount! : 6967,
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : '1d880456-9824-4d93-87f6-d6f9660de72d',
    };
};

export const aTimeTracking_ProjectEstimate = (overrides?: Partial<TimeTracking_ProjectEstimate>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ProjectEstimate' } & TimeTracking_ProjectEstimate => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ProjectEstimate');
    return {
        __typename: 'TimeTracking_ProjectEstimate',
        customerId: overrides && overrides.hasOwnProperty('customerId') ? overrides.customerId! : 'b5ece291-c3fd-4e56-a18c-b29eb943c9b5',
        fieldRef: overrides && overrides.hasOwnProperty('fieldRef') ? overrides.fieldRef! : 'consequatur',
        fieldType: overrides && overrides.hasOwnProperty('fieldType') ? overrides.fieldType! : TimeTracking_FieldType.CustomField,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'b61d1ed3-62af-4fb1-885e-d7575196a1ce',
        projectElapsedSeconds: overrides && overrides.hasOwnProperty('projectElapsedSeconds') ? overrides.projectElapsedSeconds! : 'nemo',
        projectEstimateItems: overrides && overrides.hasOwnProperty('projectEstimateItems') ? overrides.projectEstimateItems! : relationshipsToOmit.has('TimeTracking_FieldOptionEstimatesConnection') ? {} as TimeTracking_FieldOptionEstimatesConnection : aTimeTracking_FieldOptionEstimatesConnection({}, relationshipsToOmit),
        projectEstimateType: overrides && overrides.hasOwnProperty('projectEstimateType') ? overrides.projectEstimateType! : TimeTracking_ProjectEstimateType.ByFieldOption,
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : '099eebed-e1dd-4c02-b084-872517b353dc',
        totalEstimatedSeconds: overrides && overrides.hasOwnProperty('totalEstimatedSeconds') ? overrides.totalEstimatedSeconds! : 'debitis',
    };
};

export const aTimeTracking_ProjectEstimateProjectRefInput = (overrides?: Partial<TimeTracking_ProjectEstimateProjectRefInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ProjectEstimateProjectRefInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ProjectEstimateProjectRefInput');
    return {
        customerId: overrides && overrides.hasOwnProperty('customerId') ? overrides.customerId! : '6ee88eb2-9058-4b91-954c-b90e5e0c3b8b',
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : '8580c743-ca37-45a6-9758-b1ff580cfc89',
    };
};

export const aTimeTracking_ProjectEstimatesConnection = (overrides?: Partial<TimeTracking_ProjectEstimatesConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ProjectEstimatesConnection' } & TimeTracking_ProjectEstimatesConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ProjectEstimatesConnection');
    return {
        __typename: 'TimeTracking_ProjectEstimatesConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_ProjectEstimatesEdge') ? {} as TimeTracking_ProjectEstimatesEdge : aTimeTracking_ProjectEstimatesEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ProjectEstimatesEdge = (overrides?: Partial<TimeTracking_ProjectEstimatesEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ProjectEstimatesEdge' } & TimeTracking_ProjectEstimatesEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ProjectEstimatesEdge');
    return {
        __typename: 'TimeTracking_ProjectEstimatesEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'voluptatem',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_ProjectEstimate') ? {} as TimeTracking_ProjectEstimate : aTimeTracking_ProjectEstimate({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ProjectEstimatesInput = (overrides?: Partial<TimeTracking_ProjectEstimatesInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ProjectEstimatesInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ProjectEstimatesInput');
    return {
        projectIds: overrides && overrides.hasOwnProperty('projectIds') ? overrides.projectIds! : ['a3eefba1-6430-4103-a3ab-ea100cddd54c'],
        projectRefs: overrides && overrides.hasOwnProperty('projectRefs') ? overrides.projectRefs! : [relationshipsToOmit.has('TimeTracking_ProjectEstimateProjectRefInput') ? {} as TimeTracking_ProjectEstimateProjectRefInput : aTimeTracking_ProjectEstimateProjectRefInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_RemoveGroupManagersError = (overrides?: Partial<TimeTracking_RemoveGroupManagersError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_RemoveGroupManagersError' } & TimeTracking_RemoveGroupManagersError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_RemoveGroupManagersError');
    return {
        __typename: 'TimeTracking_RemoveGroupManagersError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'quasi',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'officiis',
        groupId: overrides && overrides.hasOwnProperty('groupId') ? overrides.groupId! : 'et',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'facilis',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'porro',
    };
};

export const aTimeTracking_RemoveGroupManagersInput = (overrides?: Partial<TimeTracking_RemoveGroupManagersInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_RemoveGroupManagersInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_RemoveGroupManagersInput');
    return {
        groupId: overrides && overrides.hasOwnProperty('groupId') ? overrides.groupId! : '8b2526b4-c101-459c-b196-eb0b6a7c319f',
        managers: overrides && overrides.hasOwnProperty('managers') ? overrides.managers! : [relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_RemoveGroupManagersPayload = (overrides?: Partial<TimeTracking_RemoveGroupManagersPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_RemoveGroupManagersPayload' } & TimeTracking_RemoveGroupManagersPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_RemoveGroupManagersPayload');
    return {
        __typename: 'TimeTracking_RemoveGroupManagersPayload',
        group: overrides && overrides.hasOwnProperty('group') ? overrides.group! : relationshipsToOmit.has('TimeTracking_Group') ? {} as TimeTracking_Group : aTimeTracking_Group({}, relationshipsToOmit),
        removalResults: overrides && overrides.hasOwnProperty('removalResults') ? overrides.removalResults! : [relationshipsToOmit.has('TimeTracking_GroupManagerRemovalError') ? {} as TimeTracking_GroupManagerRemovalError : aTimeTracking_GroupManagerRemovalError({}, relationshipsToOmit)],
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'dolorem',
    };
};

export const aTimeTracking_RemoveGroupMembersError = (overrides?: Partial<TimeTracking_RemoveGroupMembersError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_RemoveGroupMembersError' } & TimeTracking_RemoveGroupMembersError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_RemoveGroupMembersError');
    return {
        __typename: 'TimeTracking_RemoveGroupMembersError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'maxime',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'qui',
        groupId: overrides && overrides.hasOwnProperty('groupId') ? overrides.groupId! : 'itaque',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'accusamus',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'delectus',
    };
};

export const aTimeTracking_RemoveGroupMembersInput = (overrides?: Partial<TimeTracking_RemoveGroupMembersInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_RemoveGroupMembersInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_RemoveGroupMembersInput');
    return {
        groupId: overrides && overrides.hasOwnProperty('groupId') ? overrides.groupId! : 'fa41768e-73bb-41c4-8731-3c8fc55169bb',
        members: overrides && overrides.hasOwnProperty('members') ? overrides.members! : [relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_RemoveGroupMembersPayload = (overrides?: Partial<TimeTracking_RemoveGroupMembersPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_RemoveGroupMembersPayload' } & TimeTracking_RemoveGroupMembersPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_RemoveGroupMembersPayload');
    return {
        __typename: 'TimeTracking_RemoveGroupMembersPayload',
        group: overrides && overrides.hasOwnProperty('group') ? overrides.group! : relationshipsToOmit.has('TimeTracking_Group') ? {} as TimeTracking_Group : aTimeTracking_Group({}, relationshipsToOmit),
        removalResults: overrides && overrides.hasOwnProperty('removalResults') ? overrides.removalResults! : [relationshipsToOmit.has('TimeTracking_GroupMemberRemovalError') ? {} as TimeTracking_GroupMemberRemovalError : aTimeTracking_GroupMemberRemovalError({}, relationshipsToOmit)],
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'voluptatem',
    };
};

export const aTimeTracking_ResetUserSettingsError = (overrides?: Partial<TimeTracking_ResetUserSettingsError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ResetUserSettingsError' } & TimeTracking_ResetUserSettingsError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ResetUserSettingsError');
    return {
        __typename: 'TimeTracking_ResetUserSettingsError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'beatae',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'saepe',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'aut',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'explicabo',
    };
};

export const aTimeTracking_ResetUserSettingsInput = (overrides?: Partial<TimeTracking_ResetUserSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ResetUserSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ResetUserSettingsInput');
    return {
        settings: overrides && overrides.hasOwnProperty('settings') ? overrides.settings! : [TimeTracking_UserSettingsForReset.ClockInNotification],
        settingsFor: overrides && overrides.hasOwnProperty('settingsFor') ? overrides.settingsFor! : relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ResetUserSettingsPayload = (overrides?: Partial<TimeTracking_ResetUserSettingsPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ResetUserSettingsPayload' } & TimeTracking_ResetUserSettingsPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ResetUserSettingsPayload');
    return {
        __typename: 'TimeTracking_ResetUserSettingsPayload',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'vitae',
        userSettings: overrides && overrides.hasOwnProperty('userSettings') ? overrides.userSettings! : relationshipsToOmit.has('TimeTracking_UserSettings') ? {} as TimeTracking_UserSettings : aTimeTracking_UserSettings({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ScheduleEmployerSettings = (overrides?: Partial<TimeTracking_ScheduleEmployerSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ScheduleEmployerSettings' } & TimeTracking_ScheduleEmployerSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ScheduleEmployerSettings');
    return {
        __typename: 'TimeTracking_ScheduleEmployerSettings',
        manage: overrides && overrides.hasOwnProperty('manage') ? overrides.manage! : relationshipsToOmit.has('TimeTracking_SettingScheduleManagePreference') ? {} as TimeTracking_SettingScheduleManagePreference : aTimeTracking_SettingScheduleManagePreference({}, relationshipsToOmit),
        view: overrides && overrides.hasOwnProperty('view') ? overrides.view! : relationshipsToOmit.has('TimeTracking_SettingScheduleViewPreference') ? {} as TimeTracking_SettingScheduleViewPreference : aTimeTracking_SettingScheduleViewPreference({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ScheduleEmployerSettingsInput = (overrides?: Partial<TimeTracking_ScheduleEmployerSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_ScheduleEmployerSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ScheduleEmployerSettingsInput');
    return {
        manage: overrides && overrides.hasOwnProperty('manage') ? overrides.manage! : relationshipsToOmit.has('TimeTracking_UpdateSettingScheduleManageInput') ? {} as TimeTracking_UpdateSettingScheduleManageInput : aTimeTracking_UpdateSettingScheduleManageInput({}, relationshipsToOmit),
        view: overrides && overrides.hasOwnProperty('view') ? overrides.view! : relationshipsToOmit.has('TimeTracking_UpdateSettingScheduleViewInput') ? {} as TimeTracking_UpdateSettingScheduleViewInput : aTimeTracking_UpdateSettingScheduleViewInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_ScheduleNotificationSettings = (overrides?: Partial<TimeTracking_ScheduleNotificationSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ScheduleNotificationSettings' } & TimeTracking_ScheduleNotificationSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ScheduleNotificationSettings');
    return {
        __typename: 'TimeTracking_ScheduleNotificationSettings',
        publishShiftChangePreference: overrides && overrides.hasOwnProperty('publishShiftChangePreference') ? overrides.publishShiftChangePreference! : relationshipsToOmit.has('TimeTracking_SettingScheduleShiftChangeNotificationPreference') ? {} as TimeTracking_SettingScheduleShiftChangeNotificationPreference : aTimeTracking_SettingScheduleShiftChangeNotificationPreference({}, relationshipsToOmit),
        subscriptions: overrides && overrides.hasOwnProperty('subscriptions') ? overrides.subscriptions! : [relationshipsToOmit.has('TimeTracking_NotificationSubscription') ? {} as TimeTracking_NotificationSubscription : aTimeTracking_NotificationSubscription({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_SchedulePermissions = (overrides?: Partial<TimeTracking_SchedulePermissions>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_SchedulePermissions' } & TimeTracking_SchedulePermissions => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SchedulePermissions');
    return {
        __typename: 'TimeTracking_SchedulePermissions',
        manageLevel: overrides && overrides.hasOwnProperty('manageLevel') ? overrides.manageLevel! : TimeTracking_ScheduleLevel.Company,
        viewLevel: overrides && overrides.hasOwnProperty('viewLevel') ? overrides.viewLevel! : TimeTracking_ScheduleLevel.Company,
    };
};

export const aTimeTracking_SchedulePermissionsInput = (overrides?: Partial<TimeTracking_SchedulePermissionsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_SchedulePermissionsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SchedulePermissionsInput');
    return {
        manageLevel: overrides && overrides.hasOwnProperty('manageLevel') ? overrides.manageLevel! : TimeTracking_ScheduleLevel.Company,
        viewLevel: overrides && overrides.hasOwnProperty('viewLevel') ? overrides.viewLevel! : TimeTracking_ScheduleLevel.Company,
    };
};

export const aTimeTracking_ServiceItemSaleDetails = (overrides?: Partial<TimeTracking_ServiceItemSaleDetails>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ServiceItemSaleDetails' } & TimeTracking_ServiceItemSaleDetails => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ServiceItemSaleDetails');
    return {
        __typename: 'TimeTracking_ServiceItemSaleDetails',
        description: overrides && overrides.hasOwnProperty('description') ? overrides.description! : 'earum',
        price: overrides && overrides.hasOwnProperty('price') ? overrides.price! : 2.21,
    };
};

export const aTimeTracking_SettingBoolean = (overrides?: Partial<TimeTracking_SettingBoolean>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_SettingBoolean' } & TimeTracking_SettingBoolean => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SettingBoolean');
    return {
        __typename: 'TimeTracking_SettingBoolean',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : false,
    };
};

export const aTimeTracking_SettingDaysOfWeek = (overrides?: Partial<TimeTracking_SettingDaysOfWeek>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_SettingDaysOfWeek' } & TimeTracking_SettingDaysOfWeek => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SettingDaysOfWeek');
    return {
        __typename: 'TimeTracking_SettingDaysOfWeek',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : Common_DayOfWeek.Friday,
    };
};

export const aTimeTracking_SettingInteger = (overrides?: Partial<TimeTracking_SettingInteger>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_SettingInteger' } & TimeTracking_SettingInteger => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SettingInteger');
    return {
        __typename: 'TimeTracking_SettingInteger',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : 782,
    };
};

export const aTimeTracking_SettingLocationTracking = (overrides?: Partial<TimeTracking_SettingLocationTracking>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_SettingLocationTracking' } & TimeTracking_SettingLocationTracking => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SettingLocationTracking');
    return {
        __typename: 'TimeTracking_SettingLocationTracking',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : TimeTracking_LocationTrackingType.Off,
    };
};

export const aTimeTracking_SettingMeta = (overrides?: Partial<TimeTracking_SettingMeta>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_SettingMeta' } & TimeTracking_SettingMeta => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SettingMeta');
    return {
        __typename: 'TimeTracking_SettingMeta',
        createdAt: overrides && overrides.hasOwnProperty('createdAt') ? overrides.createdAt! : 'autem',
        createdBy: overrides && overrides.hasOwnProperty('createdBy') ? overrides.createdBy! : 'voluptatem',
        updatedAt: overrides && overrides.hasOwnProperty('updatedAt') ? overrides.updatedAt! : 'enim',
        updatedBy: overrides && overrides.hasOwnProperty('updatedBy') ? overrides.updatedBy! : 'minima',
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'tempore',
    };
};

export const aTimeTracking_SettingNotificationMedium = (overrides?: Partial<TimeTracking_SettingNotificationMedium>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_SettingNotificationMedium' } & TimeTracking_SettingNotificationMedium => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SettingNotificationMedium');
    return {
        __typename: 'TimeTracking_SettingNotificationMedium',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : [TimeTracking_NotificationReminderMedium.Email],
    };
};

export const aTimeTracking_SettingNotificationReminderDays = (overrides?: Partial<TimeTracking_SettingNotificationReminderDays>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_SettingNotificationReminderDays' } & TimeTracking_SettingNotificationReminderDays => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SettingNotificationReminderDays');
    return {
        __typename: 'TimeTracking_SettingNotificationReminderDays',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : [Common_DayOfWeek.Friday],
    };
};

export const aTimeTracking_SettingScheduleManagePreference = (overrides?: Partial<TimeTracking_SettingScheduleManagePreference>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_SettingScheduleManagePreference' } & TimeTracking_SettingScheduleManagePreference => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SettingScheduleManagePreference');
    return {
        __typename: 'TimeTracking_SettingScheduleManagePreference',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : TimeTracking_ScheduleManagePreference.Company,
    };
};

export const aTimeTracking_SettingScheduleShiftChangeNotificationPreference = (overrides?: Partial<TimeTracking_SettingScheduleShiftChangeNotificationPreference>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_SettingScheduleShiftChangeNotificationPreference' } & TimeTracking_SettingScheduleShiftChangeNotificationPreference => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SettingScheduleShiftChangeNotificationPreference');
    return {
        __typename: 'TimeTracking_SettingScheduleShiftChangeNotificationPreference',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : TimeTracking_ScheduleShiftChangeNotificationPreference.Always,
    };
};

export const aTimeTracking_SettingScheduleViewPreference = (overrides?: Partial<TimeTracking_SettingScheduleViewPreference>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_SettingScheduleViewPreference' } & TimeTracking_SettingScheduleViewPreference => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SettingScheduleViewPreference');
    return {
        __typename: 'TimeTracking_SettingScheduleViewPreference',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : TimeTracking_ScheduleViewPreference.Company,
    };
};

export const aTimeTracking_SettingString = (overrides?: Partial<TimeTracking_SettingString>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_SettingString' } & TimeTracking_SettingString => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SettingString');
    return {
        __typename: 'TimeTracking_SettingString',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : 'tenetur',
    };
};

export const aTimeTracking_ShiftNotificationSettings = (overrides?: Partial<TimeTracking_ShiftNotificationSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_ShiftNotificationSettings' } & TimeTracking_ShiftNotificationSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_ShiftNotificationSettings');
    return {
        __typename: 'TimeTracking_ShiftNotificationSettings',
        notificationMedium: overrides && overrides.hasOwnProperty('notificationMedium') ? overrides.notificationMedium! : relationshipsToOmit.has('TimeTracking_SettingNotificationMedium') ? {} as TimeTracking_SettingNotificationMedium : aTimeTracking_SettingNotificationMedium({}, relationshipsToOmit),
        reminderTime: overrides && overrides.hasOwnProperty('reminderTime') ? overrides.reminderTime! : relationshipsToOmit.has('TimeTracking_SettingString') ? {} as TimeTracking_SettingString : aTimeTracking_SettingString({}, relationshipsToOmit),
    };
};

export const aTimeTracking_StandardField = (overrides?: Partial<TimeTracking_StandardField>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_StandardField' } & TimeTracking_StandardField => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardField');
    return {
        __typename: 'TimeTracking_StandardField',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'iure',
    };
};

export const aTimeTracking_StandardFieldAssignment = (overrides?: Partial<TimeTracking_StandardFieldAssignment>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_StandardFieldAssignment' } & TimeTracking_StandardFieldAssignment => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldAssignment');
    return {
        __typename: 'TimeTracking_StandardFieldAssignment',
        assigned: overrides && overrides.hasOwnProperty('assigned') ? overrides.assigned! : true,
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : relationshipsToOmit.has('TimeTracking_StandardField') ? {} as TimeTracking_StandardField : aTimeTracking_StandardField({}, relationshipsToOmit),
    };
};

export const aTimeTracking_StandardFieldAssignmentEdge = (overrides?: Partial<TimeTracking_StandardFieldAssignmentEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_StandardFieldAssignmentEdge' } & TimeTracking_StandardFieldAssignmentEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldAssignmentEdge');
    return {
        __typename: 'TimeTracking_StandardFieldAssignmentEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'ipsam',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_StandardFieldAssignment') ? {} as TimeTracking_StandardFieldAssignment : aTimeTracking_StandardFieldAssignment({}, relationshipsToOmit),
    };
};

export const aTimeTracking_StandardFieldAssignmentSummary = (overrides?: Partial<TimeTracking_StandardFieldAssignmentSummary>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_StandardFieldAssignmentSummary' } & TimeTracking_StandardFieldAssignmentSummary => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldAssignmentSummary');
    return {
        __typename: 'TimeTracking_StandardFieldAssignmentSummary',
        assignedTimeAgainstCount: overrides && overrides.hasOwnProperty('assignedTimeAgainstCount') ? overrides.assignedTimeAgainstCount! : 7408,
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'cupiditate',
    };
};

export const aTimeTracking_StandardFieldAssignmentSummaryConnection = (overrides?: Partial<TimeTracking_StandardFieldAssignmentSummaryConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_StandardFieldAssignmentSummaryConnection' } & TimeTracking_StandardFieldAssignmentSummaryConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldAssignmentSummaryConnection');
    return {
        __typename: 'TimeTracking_StandardFieldAssignmentSummaryConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_StandardFieldAssignmentSummaryEdge') ? {} as TimeTracking_StandardFieldAssignmentSummaryEdge : aTimeTracking_StandardFieldAssignmentSummaryEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
        totalTimeAgainstAssignments: overrides && overrides.hasOwnProperty('totalTimeAgainstAssignments') ? overrides.totalTimeAgainstAssignments! : 3514,
    };
};

export const aTimeTracking_StandardFieldAssignmentSummaryEdge = (overrides?: Partial<TimeTracking_StandardFieldAssignmentSummaryEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_StandardFieldAssignmentSummaryEdge' } & TimeTracking_StandardFieldAssignmentSummaryEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldAssignmentSummaryEdge');
    return {
        __typename: 'TimeTracking_StandardFieldAssignmentSummaryEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'non',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_StandardFieldAssignmentSummary') ? {} as TimeTracking_StandardFieldAssignmentSummary : aTimeTracking_StandardFieldAssignmentSummary({}, relationshipsToOmit),
    };
};

export const aTimeTracking_StandardFieldAssignmentsConnection = (overrides?: Partial<TimeTracking_StandardFieldAssignmentsConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_StandardFieldAssignmentsConnection' } & TimeTracking_StandardFieldAssignmentsConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldAssignmentsConnection');
    return {
        __typename: 'TimeTracking_StandardFieldAssignmentsConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_StandardFieldAssignmentEdge') ? {} as TimeTracking_StandardFieldAssignmentEdge : aTimeTracking_StandardFieldAssignmentEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_StandardFieldAssignmentsFilter = (overrides?: Partial<TimeTracking_StandardFieldAssignmentsFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_StandardFieldAssignmentsFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldAssignmentsFilter');
    return {
        assigned: overrides && overrides.hasOwnProperty('assigned') ? overrides.assigned! : false,
    };
};

export const aTimeTracking_StandardFieldAssignmentsInput = (overrides?: Partial<TimeTracking_StandardFieldAssignmentsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_StandardFieldAssignmentsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldAssignmentsInput');
    return {
        assignToAll: overrides && overrides.hasOwnProperty('assignToAll') ? overrides.assignToAll! : false,
        standardFieldsToAssign: overrides && overrides.hasOwnProperty('standardFieldsToAssign') ? overrides.standardFieldsToAssign! : ['error'],
        standardFieldsToUnassign: overrides && overrides.hasOwnProperty('standardFieldsToUnassign') ? overrides.standardFieldsToUnassign! : ['eos'],
    };
};

export const aTimeTracking_StandardFieldAssignmentsQueryInput = (overrides?: Partial<TimeTracking_StandardFieldAssignmentsQueryInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_StandardFieldAssignmentsQueryInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldAssignmentsQueryInput');
    return {
        customerId: overrides && overrides.hasOwnProperty('customerId') ? overrides.customerId! : '6151ebb0-f709-4818-9a9f-97fb12f5d52c',
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : 'f505ed1c-469c-4cea-bd01-32f2cb44841f',
    };
};

export const aTimeTracking_StandardFieldOptionAssignment = (overrides?: Partial<TimeTracking_StandardFieldOptionAssignment>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_StandardFieldOptionAssignment' } & TimeTracking_StandardFieldOptionAssignment => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldOptionAssignment');
    return {
        __typename: 'TimeTracking_StandardFieldOptionAssignment',
        active: overrides && overrides.hasOwnProperty('active') ? overrides.active! : false,
        assigned: overrides && overrides.hasOwnProperty('assigned') ? overrides.assigned! : false,
        fullName: overrides && overrides.hasOwnProperty('fullName') ? overrides.fullName! : 'molestiae',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '9196e970-b853-49a5-b52b-00b314260817',
        level: overrides && overrides.hasOwnProperty('level') ? overrides.level! : 3731,
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'ratione',
        numberOfChildren: overrides && overrides.hasOwnProperty('numberOfChildren') ? overrides.numberOfChildren! : 6331,
        parentId: overrides && overrides.hasOwnProperty('parentId') ? overrides.parentId! : 'consequatur',
        saleDetails: overrides && overrides.hasOwnProperty('saleDetails') ? overrides.saleDetails! : relationshipsToOmit.has('TimeTracking_ServiceItemSaleDetails') ? {} as TimeTracking_ServiceItemSaleDetails : aTimeTracking_ServiceItemSaleDetails({}, relationshipsToOmit),
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'aut',
        taxable: overrides && overrides.hasOwnProperty('taxable') ? overrides.taxable! : false,
        timeAgainstContactDAS: overrides && overrides.hasOwnProperty('timeAgainstContactDAS') ? overrides.timeAgainstContactDAS! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainstContact') ? {} as TimeTracking_TrackTimeAgainstContact : aTimeTracking_TrackTimeAgainstContact({}, relationshipsToOmit),
        timeForContactDAS: overrides && overrides.hasOwnProperty('timeForContactDAS') ? overrides.timeForContactDAS! : relationshipsToOmit.has('DataAccess_Contact') ? {} as DataAccess_Contact : aDataAccess_Contact({}, relationshipsToOmit),
    };
};

export const aTimeTracking_StandardFieldOptionAssignmentConnection = (overrides?: Partial<TimeTracking_StandardFieldOptionAssignmentConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_StandardFieldOptionAssignmentConnection' } & TimeTracking_StandardFieldOptionAssignmentConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldOptionAssignmentConnection');
    return {
        __typename: 'TimeTracking_StandardFieldOptionAssignmentConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_StandardFieldOptionAssignmentEdge') ? {} as TimeTracking_StandardFieldOptionAssignmentEdge : aTimeTracking_StandardFieldOptionAssignmentEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_StandardFieldOptionAssignmentEdge = (overrides?: Partial<TimeTracking_StandardFieldOptionAssignmentEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_StandardFieldOptionAssignmentEdge' } & TimeTracking_StandardFieldOptionAssignmentEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldOptionAssignmentEdge');
    return {
        __typename: 'TimeTracking_StandardFieldOptionAssignmentEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'molestiae',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_StandardFieldOptionAssignment') ? {} as TimeTracking_StandardFieldOptionAssignment : aTimeTracking_StandardFieldOptionAssignment({}, relationshipsToOmit),
    };
};

export const aTimeTracking_StandardFieldOptionAssignmentsFilter = (overrides?: Partial<TimeTracking_StandardFieldOptionAssignmentsFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_StandardFieldOptionAssignmentsFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldOptionAssignmentsFilter');
    return {
        active: overrides && overrides.hasOwnProperty('active') ? overrides.active! : true,
        assigned: overrides && overrides.hasOwnProperty('assigned') ? overrides.assigned! : true,
        searchText: overrides && overrides.hasOwnProperty('searchText') ? overrides.searchText! : 'excepturi',
        standardFieldOptionIds: overrides && overrides.hasOwnProperty('standardFieldOptionIds') ? overrides.standardFieldOptionIds! : ['1ee63906-ae91-4d2e-83e3-de5141ba5095'],
    };
};

export const aTimeTracking_StandardFieldOptionAssignmentsQueryInput = (overrides?: Partial<TimeTracking_StandardFieldOptionAssignmentsQueryInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_StandardFieldOptionAssignmentsQueryInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldOptionAssignmentsQueryInput');
    return {
        customerId: overrides && overrides.hasOwnProperty('customerId') ? overrides.customerId! : 'ad5b79cb-4970-4366-b40f-e6921cb291bb',
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : '9b9be44b-faaa-4ac5-a90c-2ca0ab3deda5',
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'soluta',
        timeForEntityId: overrides && overrides.hasOwnProperty('timeForEntityId') ? overrides.timeForEntityId! : 'c72c4978-461c-4708-9617-3463e0fd3981',
    };
};

export const aTimeTracking_StandardFieldOptionSummary = (overrides?: Partial<TimeTracking_StandardFieldOptionSummary>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_StandardFieldOptionSummary' } & TimeTracking_StandardFieldOptionSummary => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldOptionSummary');
    return {
        __typename: 'TimeTracking_StandardFieldOptionSummary',
        classDAS: overrides && overrides.hasOwnProperty('classDAS') ? overrides.classDAS! : relationshipsToOmit.has('DataAccess_Klass') ? {} as DataAccess_Klass : aDataAccess_Klass({}, relationshipsToOmit),
        customerAssignmentCount: overrides && overrides.hasOwnProperty('customerAssignmentCount') ? overrides.customerAssignmentCount! : 1638,
        departmentDAS: overrides && overrides.hasOwnProperty('departmentDAS') ? overrides.departmentDAS! : relationshipsToOmit.has('DataAccess_Department') ? {} as DataAccess_Department : aDataAccess_Department({}, relationshipsToOmit),
        fullName: overrides && overrides.hasOwnProperty('fullName') ? overrides.fullName! : 'nemo',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'be82c78b-b044-424b-a0cb-49fecaf74ce3',
        level: overrides && overrides.hasOwnProperty('level') ? overrides.level! : 571,
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'consequatur',
        numberOfChildren: overrides && overrides.hasOwnProperty('numberOfChildren') ? overrides.numberOfChildren! : 7886,
        parentId: overrides && overrides.hasOwnProperty('parentId') ? overrides.parentId! : 'commodi',
        saleDetails: overrides && overrides.hasOwnProperty('saleDetails') ? overrides.saleDetails! : relationshipsToOmit.has('TimeTracking_ServiceItemSaleDetails') ? {} as TimeTracking_ServiceItemSaleDetails : aTimeTracking_ServiceItemSaleDetails({}, relationshipsToOmit),
        serviceItemDAS: overrides && overrides.hasOwnProperty('serviceItemDAS') ? overrides.serviceItemDAS! : relationshipsToOmit.has('DataAccess_Product') ? {} as DataAccess_Product : aDataAccess_Product({}, relationshipsToOmit),
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'non',
        taxable: overrides && overrides.hasOwnProperty('taxable') ? overrides.taxable! : false,
        workerAssignmentCount: overrides && overrides.hasOwnProperty('workerAssignmentCount') ? overrides.workerAssignmentCount! : 9591,
    };
};

export const aTimeTracking_StandardFieldOptionSummaryConnection = (overrides?: Partial<TimeTracking_StandardFieldOptionSummaryConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_StandardFieldOptionSummaryConnection' } & TimeTracking_StandardFieldOptionSummaryConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldOptionSummaryConnection');
    return {
        __typename: 'TimeTracking_StandardFieldOptionSummaryConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_StandardFieldOptionSummaryEdge') ? {} as TimeTracking_StandardFieldOptionSummaryEdge : aTimeTracking_StandardFieldOptionSummaryEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
        totalCustomerCount: overrides && overrides.hasOwnProperty('totalCustomerCount') ? overrides.totalCustomerCount! : 7305,
        totalOptionsCount: overrides && overrides.hasOwnProperty('totalOptionsCount') ? overrides.totalOptionsCount! : 899,
        totalWorkerCount: overrides && overrides.hasOwnProperty('totalWorkerCount') ? overrides.totalWorkerCount! : 3705,
    };
};

export const aTimeTracking_StandardFieldOptionSummaryEdge = (overrides?: Partial<TimeTracking_StandardFieldOptionSummaryEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_StandardFieldOptionSummaryEdge' } & TimeTracking_StandardFieldOptionSummaryEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldOptionSummaryEdge');
    return {
        __typename: 'TimeTracking_StandardFieldOptionSummaryEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'quo',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_StandardFieldOptionSummary') ? {} as TimeTracking_StandardFieldOptionSummary : aTimeTracking_StandardFieldOptionSummary({}, relationshipsToOmit),
    };
};

export const aTimeTracking_StandardFieldOptionSummaryFilter = (overrides?: Partial<TimeTracking_StandardFieldOptionSummaryFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_StandardFieldOptionSummaryFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_StandardFieldOptionSummaryFilter');
    return {
        searchText: overrides && overrides.hasOwnProperty('searchText') ? overrides.searchText! : 'eligendi',
    };
};

export const aTimeTracking_SubmitWorkerTimeError = (overrides?: Partial<TimeTracking_SubmitWorkerTimeError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_SubmitWorkerTimeError' } & TimeTracking_SubmitWorkerTimeError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SubmitWorkerTimeError');
    return {
        __typename: 'TimeTracking_SubmitWorkerTimeError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'iure',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'veniam',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'suscipit',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'excepturi',
    };
};

export const aTimeTracking_SubmitWorkerTimeInput = (overrides?: Partial<TimeTracking_SubmitWorkerTimeInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_SubmitWorkerTimeInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SubmitWorkerTimeInput');
    return {
        submittedTo: overrides && overrides.hasOwnProperty('submittedTo') ? overrides.submittedTo! : 'est',
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : 'baca823e-8d4f-41af-b042-911cb60ccc63',
        workerType: overrides && overrides.hasOwnProperty('workerType') ? overrides.workerType! : TimeTracking_TimeForType.Employee,
    };
};

export const aTimeTracking_SubmitWorkerTimePayload = (overrides?: Partial<TimeTracking_SubmitWorkerTimePayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_SubmitWorkerTimePayload' } & TimeTracking_SubmitWorkerTimePayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_SubmitWorkerTimePayload');
    return {
        __typename: 'TimeTracking_SubmitWorkerTimePayload',
        approvedTo: overrides && overrides.hasOwnProperty('approvedTo') ? overrides.approvedTo! : 'illo',
        submittedTo: overrides && overrides.hasOwnProperty('submittedTo') ? overrides.submittedTo! : 'consequatur',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'mollitia',
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : '0eff0eaf-e90d-4516-b1e6-01806dc0f7ea',
        workerType: overrides && overrides.hasOwnProperty('workerType') ? overrides.workerType! : TimeTracking_TimeForType.Employee,
    };
};

export const aTimeTracking_TimeAgainst = (overrides?: Partial<TimeTracking_TimeAgainst>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeAgainst' } & TimeTracking_TimeAgainst => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAgainst');
    return {
        __typename: 'TimeTracking_TimeAgainst',
        timeAgainstContactDAS: overrides && overrides.hasOwnProperty('timeAgainstContactDAS') ? overrides.timeAgainstContactDAS! : relationshipsToOmit.has('DataAccess_Contact') ? {} as DataAccess_Contact : aDataAccess_Contact({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeAgainstAssignment = (overrides?: Partial<TimeTracking_TimeAgainstAssignment>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeAgainstAssignment' } & TimeTracking_TimeAgainstAssignment => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAgainstAssignment');
    return {
        __typename: 'TimeTracking_TimeAgainstAssignment',
        active: overrides && overrides.hasOwnProperty('active') ? overrides.active! : true,
        assigned: overrides && overrides.hasOwnProperty('assigned') ? overrides.assigned! : true,
        customerType: overrides && overrides.hasOwnProperty('customerType') ? overrides.customerType! : 'nobis',
        displayName: overrides && overrides.hasOwnProperty('displayName') ? overrides.displayName! : 'vitae',
        fullName: overrides && overrides.hasOwnProperty('fullName') ? overrides.fullName! : 'quo',
        level: overrides && overrides.hasOwnProperty('level') ? overrides.level! : 7622,
        numChildren: overrides && overrides.hasOwnProperty('numChildren') ? overrides.numChildren! : 9500,
        parentId: overrides && overrides.hasOwnProperty('parentId') ? overrides.parentId! : 'quidem',
        shippingAddress: overrides && overrides.hasOwnProperty('shippingAddress') ? overrides.shippingAddress! : relationshipsToOmit.has('TimeTracking_TimeAgainstShippingAddress') ? {} as TimeTracking_TimeAgainstShippingAddress : aTimeTracking_TimeAgainstShippingAddress({}, relationshipsToOmit),
        timeAgainstContactDAS: overrides && overrides.hasOwnProperty('timeAgainstContactDAS') ? overrides.timeAgainstContactDAS! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainstContact') ? {} as TimeTracking_TrackTimeAgainstContact : aTimeTracking_TrackTimeAgainstContact({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeAgainstAssignmentConnection = (overrides?: Partial<TimeTracking_TimeAgainstAssignmentConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeAgainstAssignmentConnection' } & TimeTracking_TimeAgainstAssignmentConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAgainstAssignmentConnection');
    return {
        __typename: 'TimeTracking_TimeAgainstAssignmentConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_TimeAgainstAssignmentEdge') ? {} as TimeTracking_TimeAgainstAssignmentEdge : aTimeTracking_TimeAgainstAssignmentEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
        totalTimeAgainstCount: overrides && overrides.hasOwnProperty('totalTimeAgainstCount') ? overrides.totalTimeAgainstCount! : 7256,
    };
};

export const aTimeTracking_TimeAgainstAssignmentEdge = (overrides?: Partial<TimeTracking_TimeAgainstAssignmentEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeAgainstAssignmentEdge' } & TimeTracking_TimeAgainstAssignmentEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAgainstAssignmentEdge');
    return {
        __typename: 'TimeTracking_TimeAgainstAssignmentEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'voluptate',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_TimeAgainstAssignment') ? {} as TimeTracking_TimeAgainstAssignment : aTimeTracking_TimeAgainstAssignment({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeAgainstAssignmentSummary = (overrides?: Partial<TimeTracking_TimeAgainstAssignmentSummary>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeAgainstAssignmentSummary' } & TimeTracking_TimeAgainstAssignmentSummary => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAgainstAssignmentSummary');
    return {
        __typename: 'TimeTracking_TimeAgainstAssignmentSummary',
        assignedCustomFieldCount: overrides && overrides.hasOwnProperty('assignedCustomFieldCount') ? overrides.assignedCustomFieldCount! : 9623,
        assignedStandardFieldCount: overrides && overrides.hasOwnProperty('assignedStandardFieldCount') ? overrides.assignedStandardFieldCount! : 6881,
        assignedTimeForCount: overrides && overrides.hasOwnProperty('assignedTimeForCount') ? overrides.assignedTimeForCount! : 4268,
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TimeAgainstAssignment') ? {} as TimeTracking_TimeAgainstAssignment : aTimeTracking_TimeAgainstAssignment({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeAgainstAssignmentSummaryConnection = (overrides?: Partial<TimeTracking_TimeAgainstAssignmentSummaryConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeAgainstAssignmentSummaryConnection' } & TimeTracking_TimeAgainstAssignmentSummaryConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAgainstAssignmentSummaryConnection');
    return {
        __typename: 'TimeTracking_TimeAgainstAssignmentSummaryConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_TimeAgainstAssignmentSummaryEdge') ? {} as TimeTracking_TimeAgainstAssignmentSummaryEdge : aTimeTracking_TimeAgainstAssignmentSummaryEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
        totalCustomFieldAssignments: overrides && overrides.hasOwnProperty('totalCustomFieldAssignments') ? overrides.totalCustomFieldAssignments! : 48,
        totalStandardFieldAssignments: overrides && overrides.hasOwnProperty('totalStandardFieldAssignments') ? overrides.totalStandardFieldAssignments! : 8471,
        totalTimeAgainstCount: overrides && overrides.hasOwnProperty('totalTimeAgainstCount') ? overrides.totalTimeAgainstCount! : 7065,
        totalTimeForAssignments: overrides && overrides.hasOwnProperty('totalTimeForAssignments') ? overrides.totalTimeForAssignments! : 7398,
    };
};

export const aTimeTracking_TimeAgainstAssignmentSummaryEdge = (overrides?: Partial<TimeTracking_TimeAgainstAssignmentSummaryEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeAgainstAssignmentSummaryEdge' } & TimeTracking_TimeAgainstAssignmentSummaryEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAgainstAssignmentSummaryEdge');
    return {
        __typename: 'TimeTracking_TimeAgainstAssignmentSummaryEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'ducimus',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_TimeAgainstAssignmentSummary') ? {} as TimeTracking_TimeAgainstAssignmentSummary : aTimeTracking_TimeAgainstAssignmentSummary({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeAgainstAssignmentSummaryFilter = (overrides?: Partial<TimeTracking_TimeAgainstAssignmentSummaryFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeAgainstAssignmentSummaryFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAgainstAssignmentSummaryFilter');
    return {
        searchText: overrides && overrides.hasOwnProperty('searchText') ? overrides.searchText! : 'veniam',
        timeAgainstEntityIds: overrides && overrides.hasOwnProperty('timeAgainstEntityIds') ? overrides.timeAgainstEntityIds! : ['27d6d95e-ffbb-4f17-9259-c92a118429ea'],
    };
};

export const aTimeTracking_TimeAgainstAssignmentsFilter = (overrides?: Partial<TimeTracking_TimeAgainstAssignmentsFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeAgainstAssignmentsFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAgainstAssignmentsFilter');
    return {
        assigned: overrides && overrides.hasOwnProperty('assigned') ? overrides.assigned! : false,
        searchText: overrides && overrides.hasOwnProperty('searchText') ? overrides.searchText! : 'suscipit',
        timeAgainstIds: overrides && overrides.hasOwnProperty('timeAgainstIds') ? overrides.timeAgainstIds! : ['27ec987f-ee90-451c-bdf9-a1fdf942b12a'],
    };
};

export const aTimeTracking_TimeAgainstAssignmentsInput = (overrides?: Partial<TimeTracking_TimeAgainstAssignmentsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeAgainstAssignmentsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAgainstAssignmentsInput');
    return {
        timeAgainstToAssign: overrides && overrides.hasOwnProperty('timeAgainstToAssign') ? overrides.timeAgainstToAssign! : [relationshipsToOmit.has('TimeTracking_TrackTimeAgainstInput') ? {} as TimeTracking_TrackTimeAgainstInput : aTimeTracking_TrackTimeAgainstInput({}, relationshipsToOmit)],
        timeAgainstToUnassign: overrides && overrides.hasOwnProperty('timeAgainstToUnassign') ? overrides.timeAgainstToUnassign! : [relationshipsToOmit.has('TimeTracking_TrackTimeAgainstInput') ? {} as TimeTracking_TrackTimeAgainstInput : aTimeTracking_TrackTimeAgainstInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_TimeAgainstAssignmentsQueryInput = (overrides?: Partial<TimeTracking_TimeAgainstAssignmentsQueryInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeAgainstAssignmentsQueryInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAgainstAssignmentsQueryInput');
    return {
        customFieldId: overrides && overrides.hasOwnProperty('customFieldId') ? overrides.customFieldId! : 'culpa',
        customFieldOptionId: overrides && overrides.hasOwnProperty('customFieldOptionId') ? overrides.customFieldOptionId! : 'consequatur',
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'est',
        standardFieldOption: overrides && overrides.hasOwnProperty('standardFieldOption') ? overrides.standardFieldOption! : '3c4006f1-d764-44cd-95e0-f5c18f633812',
        timeForEntityId: overrides && overrides.hasOwnProperty('timeForEntityId') ? overrides.timeForEntityId! : 'd5fa035e-380b-4826-ba7c-c3af77c417b8',
    };
};

export const aTimeTracking_TimeAgainstConnection = (overrides?: Partial<TimeTracking_TimeAgainstConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeAgainstConnection' } & TimeTracking_TimeAgainstConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAgainstConnection');
    return {
        __typename: 'TimeTracking_TimeAgainstConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_TimeAgainstEdge') ? {} as TimeTracking_TimeAgainstEdge : aTimeTracking_TimeAgainstEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeAgainstEdge = (overrides?: Partial<TimeTracking_TimeAgainstEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeAgainstEdge' } & TimeTracking_TimeAgainstEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAgainstEdge');
    return {
        __typename: 'TimeTracking_TimeAgainstEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'mollitia',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainstNode') ? {} as TimeTracking_TrackTimeAgainstNode : aTimeTracking_TrackTimeAgainstNode({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeAgainstInput = (overrides?: Partial<TimeTracking_TimeAgainstInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeAgainstInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAgainstInput');
    return {
        orderOn: overrides && overrides.hasOwnProperty('orderOn') ? overrides.orderOn! : TimeTracking_TimeAgainstOrderOn.LastUsed,
        timeForEntityId: overrides && overrides.hasOwnProperty('timeForEntityId') ? overrides.timeForEntityId! : 'nam',
    };
};

export const aTimeTracking_TimeAgainstShippingAddress = (overrides?: Partial<TimeTracking_TimeAgainstShippingAddress>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeAgainstShippingAddress' } & TimeTracking_TimeAgainstShippingAddress => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAgainstShippingAddress');
    return {
        __typename: 'TimeTracking_TimeAgainstShippingAddress',
        city: overrides && overrides.hasOwnProperty('city') ? overrides.city! : 'voluptatum',
        country: overrides && overrides.hasOwnProperty('country') ? overrides.country! : 'quasi',
        lines: overrides && overrides.hasOwnProperty('lines') ? overrides.lines! : 'consectetur',
        postalCode: overrides && overrides.hasOwnProperty('postalCode') ? overrides.postalCode! : 'perspiciatis',
        state: overrides && overrides.hasOwnProperty('state') ? overrides.state! : 'quam',
    };
};

export const aTimeTracking_TimeAndDateEmployerSettings = (overrides?: Partial<TimeTracking_TimeAndDateEmployerSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeAndDateEmployerSettings' } & TimeTracking_TimeAndDateEmployerSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAndDateEmployerSettings');
    return {
        __typename: 'TimeTracking_TimeAndDateEmployerSettings',
        clockFormat: overrides && overrides.hasOwnProperty('clockFormat') ? overrides.clockFormat! : relationshipsToOmit.has('TimeTracking_SettingInteger') ? {} as TimeTracking_SettingInteger : aTimeTracking_SettingInteger({}, relationshipsToOmit),
        timeZone: overrides && overrides.hasOwnProperty('timeZone') ? overrides.timeZone! : relationshipsToOmit.has('TimeTracking_SettingString') ? {} as TimeTracking_SettingString : aTimeTracking_SettingString({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeAndDateEmployerSettingsInput = (overrides?: Partial<TimeTracking_TimeAndDateEmployerSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeAndDateEmployerSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeAndDateEmployerSettingsInput');
    return {
        clockFormat: overrides && overrides.hasOwnProperty('clockFormat') ? overrides.clockFormat! : relationshipsToOmit.has('TimeTracking_UpdateSettingIntegerInput') ? {} as TimeTracking_UpdateSettingIntegerInput : aTimeTracking_UpdateSettingIntegerInput({}, relationshipsToOmit),
        timeZone: overrides && overrides.hasOwnProperty('timeZone') ? overrides.timeZone! : relationshipsToOmit.has('TimeTracking_UpdateSettingStringInput') ? {} as TimeTracking_UpdateSettingStringInput : aTimeTracking_UpdateSettingStringInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeCostSummary = (overrides?: Partial<TimeTracking_TimeCostSummary>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeCostSummary' } & TimeTracking_TimeCostSummary => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeCostSummary');
    return {
        __typename: 'TimeTracking_TimeCostSummary',
        beginDate: overrides && overrides.hasOwnProperty('beginDate') ? overrides.beginDate! : '1970-01-04T10:49:30.185Z',
        customerId: overrides && overrides.hasOwnProperty('customerId') ? overrides.customerId! : '4fb4673d-58b6-413b-8e0a-2419570403d8',
        endDate: overrides && overrides.hasOwnProperty('endDate') ? overrides.endDate! : '1970-01-05T09:16:34.470Z',
        serviceItemDAS: overrides && overrides.hasOwnProperty('serviceItemDAS') ? overrides.serviceItemDAS! : relationshipsToOmit.has('DataAccess_Product') ? {} as DataAccess_Product : aDataAccess_Product({}, relationshipsToOmit),
        serviceItemId: overrides && overrides.hasOwnProperty('serviceItemId') ? overrides.serviceItemId! : '171541f7-9b32-4b17-b864-fcb032e28951',
        timeAgainstContactDAS: overrides && overrides.hasOwnProperty('timeAgainstContactDAS') ? overrides.timeAgainstContactDAS! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainstContact') ? {} as TimeTracking_TrackTimeAgainstContact : aTimeTracking_TrackTimeAgainstContact({}, relationshipsToOmit),
        timeEntryCount: overrides && overrides.hasOwnProperty('timeEntryCount') ? overrides.timeEntryCount! : 2949,
        timeFor: overrides && overrides.hasOwnProperty('timeFor') ? overrides.timeFor! : relationshipsToOmit.has('Commerce_Vendor') ? {} as Commerce_Vendor : aCommerce_Vendor({}, relationshipsToOmit),
        timeForContactDAS: overrides && overrides.hasOwnProperty('timeForContactDAS') ? overrides.timeForContactDAS! : relationshipsToOmit.has('DataAccess_Contact') ? {} as DataAccess_Contact : aDataAccess_Contact({}, relationshipsToOmit),
        timeForType: overrides && overrides.hasOwnProperty('timeForType') ? overrides.timeForType! : TimeTracking_TimeForType.Employee,
        totalBillableCost: overrides && overrides.hasOwnProperty('totalBillableCost') ? overrides.totalBillableCost! : 'qui',
        totalBillableDurationSeconds: overrides && overrides.hasOwnProperty('totalBillableDurationSeconds') ? overrides.totalBillableDurationSeconds! : 9167,
        totalCost: overrides && overrides.hasOwnProperty('totalCost') ? overrides.totalCost! : 'qui',
        totalDurationSeconds: overrides && overrides.hasOwnProperty('totalDurationSeconds') ? overrides.totalDurationSeconds! : 9727,
    };
};

export const aTimeTracking_TimeCostSummaryConnection = (overrides?: Partial<TimeTracking_TimeCostSummaryConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeCostSummaryConnection' } & TimeTracking_TimeCostSummaryConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeCostSummaryConnection');
    return {
        __typename: 'TimeTracking_TimeCostSummaryConnection',
        currentPage: overrides && overrides.hasOwnProperty('currentPage') ? overrides.currentPage! : 5985,
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_TimeCostSummaryEdge') ? {} as TimeTracking_TimeCostSummaryEdge : aTimeTracking_TimeCostSummaryEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
        totalCount: overrides && overrides.hasOwnProperty('totalCount') ? overrides.totalCount! : 5771,
        totalPages: overrides && overrides.hasOwnProperty('totalPages') ? overrides.totalPages! : 5128,
    };
};

export const aTimeTracking_TimeCostSummaryEdge = (overrides?: Partial<TimeTracking_TimeCostSummaryEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeCostSummaryEdge' } & TimeTracking_TimeCostSummaryEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeCostSummaryEdge');
    return {
        __typename: 'TimeTracking_TimeCostSummaryEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'nostrum',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_TimeCostSummary') ? {} as TimeTracking_TimeCostSummary : aTimeTracking_TimeCostSummary({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeCostSummaryFilter = (overrides?: Partial<TimeTracking_TimeCostSummaryFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeCostSummaryFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeCostSummaryFilter');
    return {
        customerIds: overrides && overrides.hasOwnProperty('customerIds') ? overrides.customerIds! : ['22b53bd0-9db3-43ef-aa00-8de9d08326c1'],
        dateRange: overrides && overrides.hasOwnProperty('dateRange') ? overrides.dateRange! : relationshipsToOmit.has('TimeTracking_DatePeriod') ? {} as TimeTracking_DatePeriod : aTimeTracking_DatePeriod({}, relationshipsToOmit),
        employeeId: overrides && overrides.hasOwnProperty('employeeId') ? overrides.employeeId! : 'et',
        serviceItemId: overrides && overrides.hasOwnProperty('serviceItemId') ? overrides.serviceItemId! : 'incidunt',
        vendorId: overrides && overrides.hasOwnProperty('vendorId') ? overrides.vendorId! : 'tempore',
    };
};

export const aTimeTracking_TimeCostSummaryInput = (overrides?: Partial<TimeTracking_TimeCostSummaryInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeCostSummaryInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeCostSummaryInput');
    return {
        groupBy: overrides && overrides.hasOwnProperty('groupBy') ? overrides.groupBy! : TimeTracking_TimeCostSummaryGroupBy.Month,
        timeCostSummaryFilter: overrides && overrides.hasOwnProperty('timeCostSummaryFilter') ? overrides.timeCostSummaryFilter! : relationshipsToOmit.has('TimeTracking_TimeCostSummaryFilter') ? {} as TimeTracking_TimeCostSummaryFilter : aTimeTracking_TimeCostSummaryFilter({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeEntriesConnection = (overrides?: Partial<TimeTracking_TimeEntriesConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeEntriesConnection' } & TimeTracking_TimeEntriesConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeEntriesConnection');
    return {
        __typename: 'TimeTracking_TimeEntriesConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_TimeEntriesEdge') ? {} as TimeTracking_TimeEntriesEdge : aTimeTracking_TimeEntriesEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
        v3Limit: overrides && overrides.hasOwnProperty('v3Limit') ? overrides.v3Limit! : 2789,
        v3Offset: overrides && overrides.hasOwnProperty('v3Offset') ? overrides.v3Offset! : 162,
        v3TotalCount: overrides && overrides.hasOwnProperty('v3TotalCount') ? overrides.v3TotalCount! : 3638,
    };
};

export const aTimeTracking_TimeEntriesEdge = (overrides?: Partial<TimeTracking_TimeEntriesEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeEntriesEdge' } & TimeTracking_TimeEntriesEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeEntriesEdge');
    return {
        __typename: 'TimeTracking_TimeEntriesEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'laboriosam',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_TimeEntry') ? {} as TimeTracking_TimeEntry : aTimeTracking_TimeEntry({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeEntriesInput = (overrides?: Partial<TimeTracking_TimeEntriesInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeEntriesInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeEntriesInput');
    return {
        orderBy: overrides && overrides.hasOwnProperty('orderBy') ? overrides.orderBy! : [relationshipsToOmit.has('TimeTracking_TimeEntryOrderBy') ? {} as TimeTracking_TimeEntryOrderBy : aTimeTracking_TimeEntryOrderBy({}, relationshipsToOmit)],
        timeEntryFilter: overrides && overrides.hasOwnProperty('timeEntryFilter') ? overrides.timeEntryFilter! : relationshipsToOmit.has('TimeTracking_TimeEntryFilter') ? {} as TimeTracking_TimeEntryFilter : aTimeTracking_TimeEntryFilter({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeEntry = (overrides?: Partial<TimeTracking_TimeEntry>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeEntry' } & TimeTracking_TimeEntry => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeEntry');
    return {
        __typename: 'TimeTracking_TimeEntry',
        alternateIds: overrides && overrides.hasOwnProperty('alternateIds') ? overrides.alternateIds! : [relationshipsToOmit.has('Qb_AlternateId') ? {} as Qb_AlternateId : aQb_AlternateId({}, relationshipsToOmit)],
        approvalStatus: overrides && overrides.hasOwnProperty('approvalStatus') ? overrides.approvalStatus! : TimeTracking_ApprovalStatusType.Approved,
        attachmentsCount: overrides && overrides.hasOwnProperty('attachmentsCount') ? overrides.attachmentsCount! : 387,
        billableRate: overrides && overrides.hasOwnProperty('billableRate') ? overrides.billableRate! : 'quo',
        billableStatus: overrides && overrides.hasOwnProperty('billableStatus') ? overrides.billableStatus! : TimeTracking_BillableStatus.Billable,
        class: overrides && overrides.hasOwnProperty('class') ? overrides.class! : relationshipsToOmit.has('AppFoundations_CustomDimensionValue') ? {} as AppFoundations_CustomDimensionValue : anAppFoundations_CustomDimensionValue({}, relationshipsToOmit),
        classDAS: overrides && overrides.hasOwnProperty('classDAS') ? overrides.classDAS! : relationshipsToOmit.has('DataAccess_Klass') ? {} as DataAccess_Klass : aDataAccess_Klass({}, relationshipsToOmit),
        costRate: overrides && overrides.hasOwnProperty('costRate') ? overrides.costRate! : 'et',
        customExtensions: overrides && overrides.hasOwnProperty('customExtensions') ? overrides.customExtensions! : relationshipsToOmit.has('TimeTracking_CustomExtensions') ? {} as TimeTracking_CustomExtensions : aTimeTracking_CustomExtensions({}, relationshipsToOmit),
        date: overrides && overrides.hasOwnProperty('date') ? overrides.date! : '1970-01-14T08:26:55.620Z',
        department: overrides && overrides.hasOwnProperty('department') ? overrides.department! : relationshipsToOmit.has('BusinessTransaction_Department') ? {} as BusinessTransaction_Department : aBusinessTransaction_Department({}, relationshipsToOmit),
        departmentDAS: overrides && overrides.hasOwnProperty('departmentDAS') ? overrides.departmentDAS! : relationshipsToOmit.has('DataAccess_Department') ? {} as DataAccess_Department : aDataAccess_Department({}, relationshipsToOmit),
        deviceAttributes: overrides && overrides.hasOwnProperty('deviceAttributes') ? overrides.deviceAttributes! : relationshipsToOmit.has('TimeTracking_TimeEntryDeviceAttributes') ? {} as TimeTracking_TimeEntryDeviceAttributes : aTimeTracking_TimeEntryDeviceAttributes({}, relationshipsToOmit),
        distanceTracking: overrides && overrides.hasOwnProperty('distanceTracking') ? overrides.distanceTracking! : relationshipsToOmit.has('TimeTracking_DistanceTracking') ? {} as TimeTracking_DistanceTracking : aTimeTracking_DistanceTracking({}, relationshipsToOmit),
        duration: overrides && overrides.hasOwnProperty('duration') ? overrides.duration! : 8181,
        employerBreakId: overrides && overrides.hasOwnProperty('employerBreakId') ? overrides.employerBreakId! : relationshipsToOmit.has('Payroll_EmployerBreak') ? {} as Payroll_EmployerBreak : aPayroll_EmployerBreak({}, relationshipsToOmit),
        endTime: overrides && overrides.hasOwnProperty('endTime') ? overrides.endTime! : 'saepe',
        entryMethod: overrides && overrides.hasOwnProperty('entryMethod') ? overrides.entryMethod! : TimeTracking_EntryMethodType.Duration,
        hasGeoLocationPoints: overrides && overrides.hasOwnProperty('hasGeoLocationPoints') ? overrides.hasGeoLocationPoints! : false,
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '5b1472d6-1d78-473d-a883-5a99274b7e96',
        invoiceId: overrides && overrides.hasOwnProperty('invoiceId') ? overrides.invoiceId! : '43617ebd-d8c4-4c81-b17b-bf480d1aedef',
        isDeleted: overrides && overrides.hasOwnProperty('isDeleted') ? overrides.isDeleted! : false,
        isExported: overrides && overrides.hasOwnProperty('isExported') ? overrides.isExported! : true,
        isOpen: overrides && overrides.hasOwnProperty('isOpen') ? overrides.isOpen! : false,
        isSubmitted: overrides && overrides.hasOwnProperty('isSubmitted') ? overrides.isSubmitted! : false,
        isTimeOffEntry: overrides && overrides.hasOwnProperty('isTimeOffEntry') ? overrides.isTimeOffEntry! : true,
        legacyCustomFields: overrides && overrides.hasOwnProperty('legacyCustomFields') ? overrides.legacyCustomFields! : [relationshipsToOmit.has('TimeTracking_CustomField') ? {} as TimeTracking_CustomField : aTimeTracking_CustomField({}, relationshipsToOmit)],
        locked: overrides && overrides.hasOwnProperty('locked') ? overrides.locked! : true,
        lockedReason: overrides && overrides.hasOwnProperty('lockedReason') ? overrides.lockedReason! : 'ut',
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_TimeEntryMeta') ? {} as TimeTracking_TimeEntryMeta : aTimeTracking_TimeEntryMeta({}, relationshipsToOmit),
        notes: overrides && overrides.hasOwnProperty('notes') ? overrides.notes! : 'velit',
        payrollItem: overrides && overrides.hasOwnProperty('payrollItem') ? overrides.payrollItem! : relationshipsToOmit.has('Payroll_EmployeeCompensation') ? {} as Payroll_EmployeeCompensation : aPayroll_EmployeeCompensation({}, relationshipsToOmit),
        serviceItem: overrides && overrides.hasOwnProperty('serviceItem') ? overrides.serviceItem! : relationshipsToOmit.has('Commerce_ProductVariant') ? {} as Commerce_ProductVariant : aCommerce_ProductVariant({}, relationshipsToOmit),
        serviceItemDAS: overrides && overrides.hasOwnProperty('serviceItemDAS') ? overrides.serviceItemDAS! : relationshipsToOmit.has('DataAccess_Product') ? {} as DataAccess_Product : aDataAccess_Product({}, relationshipsToOmit),
        startTime: overrides && overrides.hasOwnProperty('startTime') ? overrides.startTime! : 'architecto',
        taxable: overrides && overrides.hasOwnProperty('taxable') ? overrides.taxable! : false,
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainst') ? {} as TimeTracking_TrackTimeAgainst : aTimeTracking_TrackTimeAgainst({}, relationshipsToOmit),
        timeAgainstContactDAS: overrides && overrides.hasOwnProperty('timeAgainstContactDAS') ? overrides.timeAgainstContactDAS! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainstContact') ? {} as TimeTracking_TrackTimeAgainstContact : aTimeTracking_TrackTimeAgainstContact({}, relationshipsToOmit),
        timeBreakId: overrides && overrides.hasOwnProperty('timeBreakId') ? overrides.timeBreakId! : '4669d96f-a2fe-4645-b47c-3936d323f12f',
        timeEntrySource: overrides && overrides.hasOwnProperty('timeEntrySource') ? overrides.timeEntrySource! : relationshipsToOmit.has('TimeTracking_TimeEntrySource') ? {} as TimeTracking_TimeEntrySource : aTimeTracking_TimeEntrySource({}, relationshipsToOmit),
        timeFor: overrides && overrides.hasOwnProperty('timeFor') ? overrides.timeFor! : relationshipsToOmit.has('Commerce_Vendor') ? {} as Commerce_Vendor : aCommerce_Vendor({}, relationshipsToOmit),
        timeForContactDAS: overrides && overrides.hasOwnProperty('timeForContactDAS') ? overrides.timeForContactDAS! : relationshipsToOmit.has('DataAccess_Contact') ? {} as DataAccess_Contact : aDataAccess_Contact({}, relationshipsToOmit),
        timeForType: overrides && overrides.hasOwnProperty('timeForType') ? overrides.timeForType! : TimeTracking_TimeForType.Employee,
        timeOffCategoryName: overrides && overrides.hasOwnProperty('timeOffCategoryName') ? overrides.timeOffCategoryName! : 'omnis',
        timeOffCategoryType: overrides && overrides.hasOwnProperty('timeOffCategoryType') ? overrides.timeOffCategoryType! : TimeTracking_TimeOffCategoryType.Paid,
        timeOffRequestExternalId: overrides && overrides.hasOwnProperty('timeOffRequestExternalId') ? overrides.timeOffRequestExternalId! : 'quaerat',
        timeZone: overrides && overrides.hasOwnProperty('timeZone') ? overrides.timeZone! : 'consequatur',
        v3BreakDuration: overrides && overrides.hasOwnProperty('v3BreakDuration') ? overrides.v3BreakDuration! : 7597,
        v3BreakDurationDetails: overrides && overrides.hasOwnProperty('v3BreakDurationDetails') ? overrides.v3BreakDurationDetails! : relationshipsToOmit.has('TimeTracking_V3BreakDurationDetails') ? {} as TimeTracking_V3BreakDurationDetails : aTimeTracking_V3BreakDurationDetails({}, relationshipsToOmit),
        v3DurationDetails: overrides && overrides.hasOwnProperty('v3DurationDetails') ? overrides.v3DurationDetails! : relationshipsToOmit.has('TimeTracking_V3DurationDetails') ? {} as TimeTracking_V3DurationDetails : aTimeTracking_V3DurationDetails({}, relationshipsToOmit),
        v3EndTime: overrides && overrides.hasOwnProperty('v3EndTime') ? overrides.v3EndTime! : 'iste',
        v3PayrollItem: overrides && overrides.hasOwnProperty('v3PayrollItem') ? overrides.v3PayrollItem! : relationshipsToOmit.has('Payroll_EmployeeCompensation') ? {} as Payroll_EmployeeCompensation : aPayroll_EmployeeCompensation({}, relationshipsToOmit),
        v3StartTime: overrides && overrides.hasOwnProperty('v3StartTime') ? overrides.v3StartTime! : 'maiores',
        v3TimeChargeId: overrides && overrides.hasOwnProperty('v3TimeChargeId') ? overrides.v3TimeChargeId! : 'excepturi',
        v3TransactionLocationType: overrides && overrides.hasOwnProperty('v3TransactionLocationType') ? overrides.v3TransactionLocationType! : TimeTracking_V3TransactionLocationType.FranceOverseas,
    };
};

export const aTimeTracking_TimeEntryDeviceAttributes = (overrides?: Partial<TimeTracking_TimeEntryDeviceAttributes>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeEntryDeviceAttributes' } & TimeTracking_TimeEntryDeviceAttributes => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeEntryDeviceAttributes');
    return {
        __typename: 'TimeTracking_TimeEntryDeviceAttributes',
        batterySaverEnabled: overrides && overrides.hasOwnProperty('batterySaverEnabled') ? overrides.batterySaverEnabled! : true,
        leftGeofence: overrides && overrides.hasOwnProperty('leftGeofence') ? overrides.leftGeofence! : false,
        locationNotShared: overrides && overrides.hasOwnProperty('locationNotShared') ? overrides.locationNotShared! : true,
        loggedOutOnClock: overrides && overrides.hasOwnProperty('loggedOutOnClock') ? overrides.loggedOutOnClock! : false,
        lowBattery: overrides && overrides.hasOwnProperty('lowBattery') ? overrides.lowBattery! : true,
        mockedLocation: overrides && overrides.hasOwnProperty('mockedLocation') ? overrides.mockedLocation! : false,
        notes: overrides && overrides.hasOwnProperty('notes') ? overrides.notes! : ['voluptatem'],
    };
};

export const aTimeTracking_TimeEntryFilter = (overrides?: Partial<TimeTracking_TimeEntryFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeEntryFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeEntryFilter');
    return {
        billableRate: overrides && overrides.hasOwnProperty('billableRate') ? overrides.billableRate! : relationshipsToOmit.has('TimeTracking_V3DecimalFilter') ? {} as TimeTracking_V3DecimalFilter : aTimeTracking_V3DecimalFilter({}, relationshipsToOmit),
        billableStatus: overrides && overrides.hasOwnProperty('billableStatus') ? overrides.billableStatus! : relationshipsToOmit.has('TimeTracking_V3BillableStatusFilter') ? {} as TimeTracking_V3BillableStatusFilter : aTimeTracking_V3BillableStatusFilter({}, relationshipsToOmit),
        breakDuration: overrides && overrides.hasOwnProperty('breakDuration') ? overrides.breakDuration! : relationshipsToOmit.has('TimeTracking_V3IntFilter') ? {} as TimeTracking_V3IntFilter : aTimeTracking_V3IntFilter({}, relationshipsToOmit),
        classId: overrides && overrides.hasOwnProperty('classId') ? overrides.classId! : relationshipsToOmit.has('TimeTracking_V3IdFilter') ? {} as TimeTracking_V3IdFilter : aTimeTracking_V3IdFilter({}, relationshipsToOmit),
        createdTime: overrides && overrides.hasOwnProperty('createdTime') ? overrides.createdTime! : relationshipsToOmit.has('TimeTracking_V3DateTimeFilter') ? {} as TimeTracking_V3DateTimeFilter : aTimeTracking_V3DateTimeFilter({}, relationshipsToOmit),
        customerId: overrides && overrides.hasOwnProperty('customerId') ? overrides.customerId! : relationshipsToOmit.has('TimeTracking_V3IdFilter') ? {} as TimeTracking_V3IdFilter : aTimeTracking_V3IdFilter({}, relationshipsToOmit),
        date: overrides && overrides.hasOwnProperty('date') ? overrides.date! : relationshipsToOmit.has('TimeTracking_V3DateFilter') ? {} as TimeTracking_V3DateFilter : aTimeTracking_V3DateFilter({}, relationshipsToOmit),
        departmentId: overrides && overrides.hasOwnProperty('departmentId') ? overrides.departmentId! : relationshipsToOmit.has('TimeTracking_V3IdFilter') ? {} as TimeTracking_V3IdFilter : aTimeTracking_V3IdFilter({}, relationshipsToOmit),
        duration: overrides && overrides.hasOwnProperty('duration') ? overrides.duration! : relationshipsToOmit.has('TimeTracking_V3IntFilter') ? {} as TimeTracking_V3IntFilter : aTimeTracking_V3IntFilter({}, relationshipsToOmit),
        isDeleted: overrides && overrides.hasOwnProperty('isDeleted') ? overrides.isDeleted! : relationshipsToOmit.has('TimeTracking_V3BooleanFilter') ? {} as TimeTracking_V3BooleanFilter : aTimeTracking_V3BooleanFilter({}, relationshipsToOmit),
        isExported: overrides && overrides.hasOwnProperty('isExported') ? overrides.isExported! : true,
        isOpen: overrides && overrides.hasOwnProperty('isOpen') ? overrides.isOpen! : false,
        isTimeOffEntry: overrides && overrides.hasOwnProperty('isTimeOffEntry') ? overrides.isTimeOffEntry! : false,
        lastModifiedTime: overrides && overrides.hasOwnProperty('lastModifiedTime') ? overrides.lastModifiedTime! : relationshipsToOmit.has('TimeTracking_V3DateTimeFilter') ? {} as TimeTracking_V3DateTimeFilter : aTimeTracking_V3DateTimeFilter({}, relationshipsToOmit),
        payrollItemId: overrides && overrides.hasOwnProperty('payrollItemId') ? overrides.payrollItemId! : relationshipsToOmit.has('TimeTracking_V3IdFilter') ? {} as TimeTracking_V3IdFilter : aTimeTracking_V3IdFilter({}, relationshipsToOmit),
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : relationshipsToOmit.has('TimeTracking_V3IdFilter') ? {} as TimeTracking_V3IdFilter : aTimeTracking_V3IdFilter({}, relationshipsToOmit),
        serviceItemId: overrides && overrides.hasOwnProperty('serviceItemId') ? overrides.serviceItemId! : relationshipsToOmit.has('TimeTracking_V3IdFilter') ? {} as TimeTracking_V3IdFilter : aTimeTracking_V3IdFilter({}, relationshipsToOmit),
        taxable: overrides && overrides.hasOwnProperty('taxable') ? overrides.taxable! : relationshipsToOmit.has('TimeTracking_V3BooleanFilter') ? {} as TimeTracking_V3BooleanFilter : aTimeTracking_V3BooleanFilter({}, relationshipsToOmit),
        timeBreakId: overrides && overrides.hasOwnProperty('timeBreakId') ? overrides.timeBreakId! : relationshipsToOmit.has('TimeTracking_V3IdFilter') ? {} as TimeTracking_V3IdFilter : aTimeTracking_V3IdFilter({}, relationshipsToOmit),
        timeChargeTransactionId: overrides && overrides.hasOwnProperty('timeChargeTransactionId') ? overrides.timeChargeTransactionId! : relationshipsToOmit.has('TimeTracking_V3IdFilter') ? {} as TimeTracking_V3IdFilter : aTimeTracking_V3IdFilter({}, relationshipsToOmit),
        timeEntryId: overrides && overrides.hasOwnProperty('timeEntryId') ? overrides.timeEntryId! : relationshipsToOmit.has('TimeTracking_V3IdFilter') ? {} as TimeTracking_V3IdFilter : aTimeTracking_V3IdFilter({}, relationshipsToOmit),
        timeForEntityId: overrides && overrides.hasOwnProperty('timeForEntityId') ? overrides.timeForEntityId! : relationshipsToOmit.has('TimeTracking_V3IdFilter') ? {} as TimeTracking_V3IdFilter : aTimeTracking_V3IdFilter({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeEntryInput = (overrides?: Partial<TimeTracking_TimeEntryInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeEntryInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeEntryInput');
    return {
        alternateId: overrides && overrides.hasOwnProperty('alternateId') ? overrides.alternateId! : '2bb816a2-9fc4-42e0-8278-71aab5c675f5',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '0b4900d8-a1f6-4bc4-9534-b0b6491d916a',
        isExported: overrides && overrides.hasOwnProperty('isExported') ? overrides.isExported! : true,
    };
};

export const aTimeTracking_TimeEntryMeta = (overrides?: Partial<TimeTracking_TimeEntryMeta>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeEntryMeta' } & TimeTracking_TimeEntryMeta => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeEntryMeta');
    return {
        __typename: 'TimeTracking_TimeEntryMeta',
        createdAt: overrides && overrides.hasOwnProperty('createdAt') ? overrides.createdAt! : 'cupiditate',
        createdBy: overrides && overrides.hasOwnProperty('createdBy') ? overrides.createdBy! : 'saepe',
        updatedAt: overrides && overrides.hasOwnProperty('updatedAt') ? overrides.updatedAt! : 'ut',
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'qui',
    };
};

export const aTimeTracking_TimeEntryOrderBy = (overrides?: Partial<TimeTracking_TimeEntryOrderBy>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeEntryOrderBy => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeEntryOrderBy');
    return {
        orderDirection: overrides && overrides.hasOwnProperty('orderDirection') ? overrides.orderDirection! : Common_SortOrder.Asc,
        orderOn: overrides && overrides.hasOwnProperty('orderOn') ? overrides.orderOn! : TimeTracking_TimeEntryOrderOn.BillableRate,
    };
};

export const aTimeTracking_TimeEntrySource = (overrides?: Partial<TimeTracking_TimeEntrySource>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeEntrySource' } & TimeTracking_TimeEntrySource => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeEntrySource');
    return {
        __typename: 'TimeTracking_TimeEntrySource',
        clockInSource: overrides && overrides.hasOwnProperty('clockInSource') ? overrides.clockInSource! : 'ratione',
        clockOutSource: overrides && overrides.hasOwnProperty('clockOutSource') ? overrides.clockOutSource! : 'ab',
    };
};

export const aTimeTracking_TimeForAssignment = (overrides?: Partial<TimeTracking_TimeForAssignment>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeForAssignment' } & TimeTracking_TimeForAssignment => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeForAssignment');
    return {
        __typename: 'TimeTracking_TimeForAssignment',
        active: overrides && overrides.hasOwnProperty('active') ? overrides.active! : true,
        activeEmploymentStatus: overrides && overrides.hasOwnProperty('activeEmploymentStatus') ? overrides.activeEmploymentStatus! : true,
        assigned: overrides && overrides.hasOwnProperty('assigned') ? overrides.assigned! : false,
        contractor: overrides && overrides.hasOwnProperty('contractor') ? overrides.contractor! : false,
        displayName: overrides && overrides.hasOwnProperty('displayName') ? overrides.displayName! : 'ut',
        fullName: overrides && overrides.hasOwnProperty('fullName') ? overrides.fullName! : 'ullam',
        groupId: overrides && overrides.hasOwnProperty('groupId') ? overrides.groupId! : 'bcdc3292-2cdf-4bfa-8b0b-44922c665951',
        groupName: overrides && overrides.hasOwnProperty('groupName') ? overrides.groupName! : 'eos',
        timeForContactDAS: overrides && overrides.hasOwnProperty('timeForContactDAS') ? overrides.timeForContactDAS! : relationshipsToOmit.has('DataAccess_Contact') ? {} as DataAccess_Contact : aDataAccess_Contact({}, relationshipsToOmit),
        timeForType: overrides && overrides.hasOwnProperty('timeForType') ? overrides.timeForType! : TimeTracking_TimeForType.Employee,
    };
};

export const aTimeTracking_TimeForAssignmentEdge = (overrides?: Partial<TimeTracking_TimeForAssignmentEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeForAssignmentEdge' } & TimeTracking_TimeForAssignmentEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeForAssignmentEdge');
    return {
        __typename: 'TimeTracking_TimeForAssignmentEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'suscipit',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_TimeForAssignment') ? {} as TimeTracking_TimeForAssignment : aTimeTracking_TimeForAssignment({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeForAssignmentsConnection = (overrides?: Partial<TimeTracking_TimeForAssignmentsConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeForAssignmentsConnection' } & TimeTracking_TimeForAssignmentsConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeForAssignmentsConnection');
    return {
        __typename: 'TimeTracking_TimeForAssignmentsConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_TimeForAssignmentEdge') ? {} as TimeTracking_TimeForAssignmentEdge : aTimeTracking_TimeForAssignmentEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
        totalTimeForCount: overrides && overrides.hasOwnProperty('totalTimeForCount') ? overrides.totalTimeForCount! : 3543,
    };
};

export const aTimeTracking_TimeForAssignmentsFilter = (overrides?: Partial<TimeTracking_TimeForAssignmentsFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeForAssignmentsFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeForAssignmentsFilter');
    return {
        assigned: overrides && overrides.hasOwnProperty('assigned') ? overrides.assigned! : false,
        searchText: overrides && overrides.hasOwnProperty('searchText') ? overrides.searchText! : 'accusantium',
    };
};

export const aTimeTracking_TimeForAssignmentsInput = (overrides?: Partial<TimeTracking_TimeForAssignmentsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeForAssignmentsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeForAssignmentsInput');
    return {
        groupIdsToAssign: overrides && overrides.hasOwnProperty('groupIdsToAssign') ? overrides.groupIdsToAssign! : ['3b448075-1bd2-4fff-a950-3314846ea453'],
        groupIdsToUnassign: overrides && overrides.hasOwnProperty('groupIdsToUnassign') ? overrides.groupIdsToUnassign! : ['35decfeb-afea-43d5-bb07-49a2aef107f3'],
        timeForToAssign: overrides && overrides.hasOwnProperty('timeForToAssign') ? overrides.timeForToAssign! : [relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit)],
        timeForToUnassign: overrides && overrides.hasOwnProperty('timeForToUnassign') ? overrides.timeForToUnassign! : [relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_TimeForAssignmentsQueryInput = (overrides?: Partial<TimeTracking_TimeForAssignmentsQueryInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeForAssignmentsQueryInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeForAssignmentsQueryInput');
    return {
        customFieldId: overrides && overrides.hasOwnProperty('customFieldId') ? overrides.customFieldId! : '5ec93182-90cb-4735-a49e-3e8d5fa4353a',
        customFieldOptionId: overrides && overrides.hasOwnProperty('customFieldOptionId') ? overrides.customFieldOptionId! : '0fcc7936-6c13-4b9f-8eaa-c924ccaf0979',
        customerId: overrides && overrides.hasOwnProperty('customerId') ? overrides.customerId! : '0a0b2013-d952-41b2-98db-6e42a8aa9133',
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : '2d18ed0e-52ab-4fa8-b38c-d9a0b95a0bda',
        standardFieldLabel: overrides && overrides.hasOwnProperty('standardFieldLabel') ? overrides.standardFieldLabel! : 'omnis',
        standardFieldOption: overrides && overrides.hasOwnProperty('standardFieldOption') ? overrides.standardFieldOption! : '6449a679-f875-4eb9-8e22-ca1a3fb4fc72',
    };
};

export const aTimeTracking_TimeForInput = (overrides?: Partial<TimeTracking_TimeForInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimeForInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeForInput');
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '887fc8b9-72a2-47f4-9f0e-a481aa4e9147',
        timeForType: overrides && overrides.hasOwnProperty('timeForType') ? overrides.timeForType! : TimeTracking_TimeForType.Employee,
    };
};

export const aTimeTracking_TimeSheetCustomFieldsSettings = (overrides?: Partial<TimeTracking_TimeSheetCustomFieldsSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeSheetCustomFieldsSettings' } & TimeTracking_TimeSheetCustomFieldsSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeSheetCustomFieldsSettings');
    return {
        __typename: 'TimeTracking_TimeSheetCustomFieldsSettings',
        classEnabled: overrides && overrides.hasOwnProperty('classEnabled') ? overrides.classEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        customDimensions: overrides && overrides.hasOwnProperty('customDimensions') ? overrides.customDimensions! : [relationshipsToOmit.has('TimeTracking_CustomDimensionSetting') ? {} as TimeTracking_CustomDimensionSetting : aTimeTracking_CustomDimensionSetting({}, relationshipsToOmit)],
        customersEnabled: overrides && overrides.hasOwnProperty('customersEnabled') ? overrides.customersEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        locationEnabled: overrides && overrides.hasOwnProperty('locationEnabled') ? overrides.locationEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeSheetNotesSettings = (overrides?: Partial<TimeTracking_TimeSheetNotesSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeSheetNotesSettings' } & TimeTracking_TimeSheetNotesSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeSheetNotesSettings');
    return {
        __typename: 'TimeTracking_TimeSheetNotesSettings',
        editEnabled: overrides && overrides.hasOwnProperty('editEnabled') ? overrides.editEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        enabled: overrides && overrides.hasOwnProperty('enabled') ? overrides.enabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        requiredEnabled: overrides && overrides.hasOwnProperty('requiredEnabled') ? overrides.requiredEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimeSheetSettings = (overrides?: Partial<TimeTracking_TimeSheetSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimeSheetSettings' } & TimeTracking_TimeSheetSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimeSheetSettings');
    return {
        __typename: 'TimeTracking_TimeSheetSettings',
        clockOutOverrideHours: overrides && overrides.hasOwnProperty('clockOutOverrideHours') ? overrides.clockOutOverrideHours! : relationshipsToOmit.has('TimeTracking_SettingInteger') ? {} as TimeTracking_SettingInteger : aTimeTracking_SettingInteger({}, relationshipsToOmit),
        editClockOutTimeEnabled: overrides && overrides.hasOwnProperty('editClockOutTimeEnabled') ? overrides.editClockOutTimeEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        locationTracking: overrides && overrides.hasOwnProperty('locationTracking') ? overrides.locationTracking! : relationshipsToOmit.has('TimeTracking_SettingLocationTracking') ? {} as TimeTracking_SettingLocationTracking : aTimeTracking_SettingLocationTracking({}, relationshipsToOmit),
        manageOwnTimesheetEnabled: overrides && overrides.hasOwnProperty('manageOwnTimesheetEnabled') ? overrides.manageOwnTimesheetEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        mileageTrackingEnabled: overrides && overrides.hasOwnProperty('mileageTrackingEnabled') ? overrides.mileageTrackingEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        mobileTimeTrackingEnabled: overrides && overrides.hasOwnProperty('mobileTimeTrackingEnabled') ? overrides.mobileTimeTrackingEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        signatureCaptureEnabled: overrides && overrides.hasOwnProperty('signatureCaptureEnabled') ? overrides.signatureCaptureEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        splitAtMidnightEnabled: overrides && overrides.hasOwnProperty('splitAtMidnightEnabled') ? overrides.splitAtMidnightEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimesheetEditNotificationSettings = (overrides?: Partial<TimeTracking_TimesheetEditNotificationSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimesheetEditNotificationSettings' } & TimeTracking_TimesheetEditNotificationSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimesheetEditNotificationSettings');
    return {
        __typename: 'TimeTracking_TimesheetEditNotificationSettings',
        adminEnabled: overrides && overrides.hasOwnProperty('adminEnabled') ? overrides.adminEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
        groupManagerEnabled: overrides && overrides.hasOwnProperty('groupManagerEnabled') ? overrides.groupManagerEnabled! : relationshipsToOmit.has('TimeTracking_SettingBoolean') ? {} as TimeTracking_SettingBoolean : aTimeTracking_SettingBoolean({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimesheetManagementEmployerSettings = (overrides?: Partial<TimeTracking_TimesheetManagementEmployerSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimesheetManagementEmployerSettings' } & TimeTracking_TimesheetManagementEmployerSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimesheetManagementEmployerSettings');
    return {
        __typename: 'TimeTracking_TimesheetManagementEmployerSettings',
        customFields: overrides && overrides.hasOwnProperty('customFields') ? overrides.customFields! : relationshipsToOmit.has('TimeTracking_TimeSheetCustomFieldsSettings') ? {} as TimeTracking_TimeSheetCustomFieldsSettings : aTimeTracking_TimeSheetCustomFieldsSettings({}, relationshipsToOmit),
        notes: overrides && overrides.hasOwnProperty('notes') ? overrides.notes! : relationshipsToOmit.has('TimeTracking_TimeSheetNotesSettings') ? {} as TimeTracking_TimeSheetNotesSettings : aTimeTracking_TimeSheetNotesSettings({}, relationshipsToOmit),
        timesheet: overrides && overrides.hasOwnProperty('timesheet') ? overrides.timesheet! : relationshipsToOmit.has('TimeTracking_TimeSheetSettings') ? {} as TimeTracking_TimeSheetSettings : aTimeTracking_TimeSheetSettings({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimesheetManagementEmployerSettingsInput = (overrides?: Partial<TimeTracking_TimesheetManagementEmployerSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimesheetManagementEmployerSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimesheetManagementEmployerSettingsInput');
    return {
        customFields: overrides && overrides.hasOwnProperty('customFields') ? overrides.customFields! : relationshipsToOmit.has('TimeTracking_UpdateCustomFieldsSettingsInput') ? {} as TimeTracking_UpdateCustomFieldsSettingsInput : aTimeTracking_UpdateCustomFieldsSettingsInput({}, relationshipsToOmit),
        notes: overrides && overrides.hasOwnProperty('notes') ? overrides.notes! : relationshipsToOmit.has('TimeTracking_TimesheetUpdateNotesSettingsInput') ? {} as TimeTracking_TimesheetUpdateNotesSettingsInput : aTimeTracking_TimesheetUpdateNotesSettingsInput({}, relationshipsToOmit),
        timesheet: overrides && overrides.hasOwnProperty('timesheet') ? overrides.timesheet! : relationshipsToOmit.has('TimeTracking_TimesheetUpdateEmployerSettingsInput') ? {} as TimeTracking_TimesheetUpdateEmployerSettingsInput : aTimeTracking_TimesheetUpdateEmployerSettingsInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimesheetRoundingEmployerSettings = (overrides?: Partial<TimeTracking_TimesheetRoundingEmployerSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TimesheetRoundingEmployerSettings' } & TimeTracking_TimesheetRoundingEmployerSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimesheetRoundingEmployerSettings');
    return {
        __typename: 'TimeTracking_TimesheetRoundingEmployerSettings',
        endTimeRounding: overrides && overrides.hasOwnProperty('endTimeRounding') ? overrides.endTimeRounding! : relationshipsToOmit.has('TimeTracking_ClockInOutRoundingSettings') ? {} as TimeTracking_ClockInOutRoundingSettings : aTimeTracking_ClockInOutRoundingSettings({}, relationshipsToOmit),
        startTimeRounding: overrides && overrides.hasOwnProperty('startTimeRounding') ? overrides.startTimeRounding! : relationshipsToOmit.has('TimeTracking_ClockInOutRoundingSettings') ? {} as TimeTracking_ClockInOutRoundingSettings : aTimeTracking_ClockInOutRoundingSettings({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimesheetRoundingEmployerSettingsInput = (overrides?: Partial<TimeTracking_TimesheetRoundingEmployerSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimesheetRoundingEmployerSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimesheetRoundingEmployerSettingsInput');
    return {
        endTimeRounding: overrides && overrides.hasOwnProperty('endTimeRounding') ? overrides.endTimeRounding! : relationshipsToOmit.has('TimeTracking_ClockInOutRoundingSettingsInput') ? {} as TimeTracking_ClockInOutRoundingSettingsInput : aTimeTracking_ClockInOutRoundingSettingsInput({}, relationshipsToOmit),
        startTimeRounding: overrides && overrides.hasOwnProperty('startTimeRounding') ? overrides.startTimeRounding! : relationshipsToOmit.has('TimeTracking_ClockInOutRoundingSettingsInput') ? {} as TimeTracking_ClockInOutRoundingSettingsInput : aTimeTracking_ClockInOutRoundingSettingsInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimesheetUpdateEmployerSettingsInput = (overrides?: Partial<TimeTracking_TimesheetUpdateEmployerSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimesheetUpdateEmployerSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimesheetUpdateEmployerSettingsInput');
    return {
        clockOutOverrideHours: overrides && overrides.hasOwnProperty('clockOutOverrideHours') ? overrides.clockOutOverrideHours! : relationshipsToOmit.has('TimeTracking_UpdateSettingIntegerInput') ? {} as TimeTracking_UpdateSettingIntegerInput : aTimeTracking_UpdateSettingIntegerInput({}, relationshipsToOmit),
        editClockOutTimeEnabled: overrides && overrides.hasOwnProperty('editClockOutTimeEnabled') ? overrides.editClockOutTimeEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        locationTracking: overrides && overrides.hasOwnProperty('locationTracking') ? overrides.locationTracking! : relationshipsToOmit.has('TimeTracking_UpdateSettingLocationTrackingInput') ? {} as TimeTracking_UpdateSettingLocationTrackingInput : aTimeTracking_UpdateSettingLocationTrackingInput({}, relationshipsToOmit),
        manageOwnTimesheetEnabled: overrides && overrides.hasOwnProperty('manageOwnTimesheetEnabled') ? overrides.manageOwnTimesheetEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        mileageTrackingEnabled: overrides && overrides.hasOwnProperty('mileageTrackingEnabled') ? overrides.mileageTrackingEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        mobileTimeTrackingEnabled: overrides && overrides.hasOwnProperty('mobileTimeTrackingEnabled') ? overrides.mobileTimeTrackingEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        signatureCaptureEnabled: overrides && overrides.hasOwnProperty('signatureCaptureEnabled') ? overrides.signatureCaptureEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        splitAtMidnightEnabled: overrides && overrides.hasOwnProperty('splitAtMidnightEnabled') ? overrides.splitAtMidnightEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TimesheetUpdateNotesSettingsInput = (overrides?: Partial<TimeTracking_TimesheetUpdateNotesSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TimesheetUpdateNotesSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TimesheetUpdateNotesSettingsInput');
    return {
        editEnabled: overrides && overrides.hasOwnProperty('editEnabled') ? overrides.editEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        enabled: overrides && overrides.hasOwnProperty('enabled') ? overrides.enabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        requiredEnabled: overrides && overrides.hasOwnProperty('requiredEnabled') ? overrides.requiredEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TotalDurationByDate = (overrides?: Partial<TimeTracking_TotalDurationByDate>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TotalDurationByDate' } & TimeTracking_TotalDurationByDate => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TotalDurationByDate');
    return {
        __typename: 'TimeTracking_TotalDurationByDate',
        date: overrides && overrides.hasOwnProperty('date') ? overrides.date! : '1970-01-09T01:34:58.798Z',
        totalDurationSeconds: overrides && overrides.hasOwnProperty('totalDurationSeconds') ? overrides.totalDurationSeconds! : 226,
    };
};

export const aTimeTracking_TotalDurationByDateConnection = (overrides?: Partial<TimeTracking_TotalDurationByDateConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TotalDurationByDateConnection' } & TimeTracking_TotalDurationByDateConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TotalDurationByDateConnection');
    return {
        __typename: 'TimeTracking_TotalDurationByDateConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_TotalDurationByDateEdge') ? {} as TimeTracking_TotalDurationByDateEdge : aTimeTracking_TotalDurationByDateEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TotalDurationByDateEdge = (overrides?: Partial<TimeTracking_TotalDurationByDateEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TotalDurationByDateEdge' } & TimeTracking_TotalDurationByDateEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TotalDurationByDateEdge');
    return {
        __typename: 'TimeTracking_TotalDurationByDateEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'non',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_TotalDurationByDate') ? {} as TimeTracking_TotalDurationByDate : aTimeTracking_TotalDurationByDate({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TotalDurationByDateFilter = (overrides?: Partial<TimeTracking_TotalDurationByDateFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TotalDurationByDateFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TotalDurationByDateFilter');
    return {
        dateRange: overrides && overrides.hasOwnProperty('dateRange') ? overrides.dateRange! : relationshipsToOmit.has('TimeTracking_DatePeriod') ? {} as TimeTracking_DatePeriod : aTimeTracking_DatePeriod({}, relationshipsToOmit),
        isExported: overrides && overrides.hasOwnProperty('isExported') ? overrides.isExported! : false,
        timeForEntityId: overrides && overrides.hasOwnProperty('timeForEntityId') ? overrides.timeForEntityId! : 'sint',
    };
};

export const aTimeTracking_TotalDurationByDateInput = (overrides?: Partial<TimeTracking_TotalDurationByDateInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TotalDurationByDateInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TotalDurationByDateInput');
    return {
        orderBy: overrides && overrides.hasOwnProperty('orderBy') ? overrides.orderBy! : [relationshipsToOmit.has('TimeTracking_TotalDurationByDateOrderBy') ? {} as TimeTracking_TotalDurationByDateOrderBy : aTimeTracking_TotalDurationByDateOrderBy({}, relationshipsToOmit)],
        totalDurationFilter: overrides && overrides.hasOwnProperty('totalDurationFilter') ? overrides.totalDurationFilter! : relationshipsToOmit.has('TimeTracking_TotalDurationByDateFilter') ? {} as TimeTracking_TotalDurationByDateFilter : aTimeTracking_TotalDurationByDateFilter({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TotalDurationByDateOrderBy = (overrides?: Partial<TimeTracking_TotalDurationByDateOrderBy>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TotalDurationByDateOrderBy => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TotalDurationByDateOrderBy');
    return {
        orderDirection: overrides && overrides.hasOwnProperty('orderDirection') ? overrides.orderDirection! : Common_SortOrder.Asc,
        orderOn: overrides && overrides.hasOwnProperty('orderOn') ? overrides.orderOn! : TimeTracking_TotalDurationByDateOrderOn.Date,
    };
};

export const aTimeTracking_TotalDurationByTimeWindow = (overrides?: Partial<TimeTracking_TotalDurationByTimeWindow>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TotalDurationByTimeWindow' } & TimeTracking_TotalDurationByTimeWindow => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TotalDurationByTimeWindow');
    return {
        __typename: 'TimeTracking_TotalDurationByTimeWindow',
        timeFor: overrides && overrides.hasOwnProperty('timeFor') ? overrides.timeFor! : relationshipsToOmit.has('Commerce_Vendor') ? {} as Commerce_Vendor : aCommerce_Vendor({}, relationshipsToOmit),
        timeForContactDAS: overrides && overrides.hasOwnProperty('timeForContactDAS') ? overrides.timeForContactDAS! : relationshipsToOmit.has('DataAccess_Contact') ? {} as DataAccess_Contact : aDataAccess_Contact({}, relationshipsToOmit),
        totalDurationSeconds: overrides && overrides.hasOwnProperty('totalDurationSeconds') ? overrides.totalDurationSeconds! : 325,
    };
};

export const aTimeTracking_TotalDurationByTimeWindowInput = (overrides?: Partial<TimeTracking_TotalDurationByTimeWindowInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TotalDurationByTimeWindowInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TotalDurationByTimeWindowInput');
    return {
        timeForEntityId: overrides && overrides.hasOwnProperty('timeForEntityId') ? overrides.timeForEntityId! : 'et',
        timeWindow: overrides && overrides.hasOwnProperty('timeWindow') ? overrides.timeWindow! : TimeTracking_TotalDurationTimeWindow.Month,
        timeWindowOffset: overrides && overrides.hasOwnProperty('timeWindowOffset') ? overrides.timeWindowOffset! : 1675,
    };
};

export const aTimeTracking_TrackTimeAgainst = (overrides?: Partial<TimeTracking_TrackTimeAgainst>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TrackTimeAgainst' } & TimeTracking_TrackTimeAgainst => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TrackTimeAgainst');
    return {
        __typename: 'TimeTracking_TrackTimeAgainst',
        customer: overrides && overrides.hasOwnProperty('customer') ? overrides.customer! : relationshipsToOmit.has('CustomerLifeCycle_Customer') ? {} as CustomerLifeCycle_Customer : aCustomerLifeCycle_Customer({}, relationshipsToOmit),
        project: overrides && overrides.hasOwnProperty('project') ? overrides.project! : relationshipsToOmit.has('ProjectManagement_Project') ? {} as ProjectManagement_Project : aProjectManagement_Project({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TrackTimeAgainstContact = (overrides?: Partial<TimeTracking_TrackTimeAgainstContact>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TrackTimeAgainstContact' } & TimeTracking_TrackTimeAgainstContact => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TrackTimeAgainstContact');
    return {
        __typename: 'TimeTracking_TrackTimeAgainstContact',
        customer: overrides && overrides.hasOwnProperty('customer') ? overrides.customer! : relationshipsToOmit.has('DataAccess_Contact') ? {} as DataAccess_Contact : aDataAccess_Contact({}, relationshipsToOmit),
        project: overrides && overrides.hasOwnProperty('project') ? overrides.project! : relationshipsToOmit.has('DataAccess_Contact') ? {} as DataAccess_Contact : aDataAccess_Contact({}, relationshipsToOmit),
    };
};

export const aTimeTracking_TrackTimeAgainstInput = (overrides?: Partial<TimeTracking_TrackTimeAgainstInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_TrackTimeAgainstInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TrackTimeAgainstInput');
    return {
        customerId: overrides && overrides.hasOwnProperty('customerId') ? overrides.customerId! : 'f050be6b-3d72-4dda-8dfe-f52d5a7a9388',
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : '12977283-ef31-42a8-8a48-864c15ec27d9',
    };
};

export const aTimeTracking_TrackTimeAgainstNode = (overrides?: Partial<TimeTracking_TrackTimeAgainstNode>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_TrackTimeAgainstNode' } & TimeTracking_TrackTimeAgainstNode => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_TrackTimeAgainstNode');
    return {
        __typename: 'TimeTracking_TrackTimeAgainstNode',
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainst') ? {} as TimeTracking_TrackTimeAgainst : aTimeTracking_TrackTimeAgainst({}, relationshipsToOmit),
        timeAgainstContactDAS: overrides && overrides.hasOwnProperty('timeAgainstContactDAS') ? overrides.timeAgainstContactDAS! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainstContact') ? {} as TimeTracking_TrackTimeAgainstContact : aTimeTracking_TrackTimeAgainstContact({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UnifiedUserLocationTracking = (overrides?: Partial<TimeTracking_UnifiedUserLocationTracking>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UnifiedUserLocationTracking' } & TimeTracking_UnifiedUserLocationTracking => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UnifiedUserLocationTracking');
    return {
        __typename: 'TimeTracking_UnifiedUserLocationTracking',
        effectiveValue: overrides && overrides.hasOwnProperty('effectiveValue') ? overrides.effectiveValue! : TimeTracking_LocationTrackingType.Off,
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : TimeTracking_UserLocationTrackingType.Off,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'neque',
    };
};

export const aTimeTracking_UnifiedUserOvertimeNotificationSettings = (overrides?: Partial<TimeTracking_UnifiedUserOvertimeNotificationSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UnifiedUserOvertimeNotificationSettings' } & TimeTracking_UnifiedUserOvertimeNotificationSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UnifiedUserOvertimeNotificationSettings');
    return {
        __typename: 'TimeTracking_UnifiedUserOvertimeNotificationSettings',
        rules: overrides && overrides.hasOwnProperty('rules') ? overrides.rules! : [relationshipsToOmit.has('TimeTracking_OvertimeNotificationRule') ? {} as TimeTracking_OvertimeNotificationRule : aTimeTracking_OvertimeNotificationRule({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_UnifiedUserScheduleNotificationSettings = (overrides?: Partial<TimeTracking_UnifiedUserScheduleNotificationSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UnifiedUserScheduleNotificationSettings' } & TimeTracking_UnifiedUserScheduleNotificationSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UnifiedUserScheduleNotificationSettings');
    return {
        __typename: 'TimeTracking_UnifiedUserScheduleNotificationSettings',
        subscriptions: overrides && overrides.hasOwnProperty('subscriptions') ? overrides.subscriptions! : [relationshipsToOmit.has('TimeTracking_NotificationSubscription') ? {} as TimeTracking_NotificationSubscription : aTimeTracking_NotificationSubscription({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_UnifiedUserSettings = (overrides?: Partial<TimeTracking_UnifiedUserSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UnifiedUserSettings' } & TimeTracking_UnifiedUserSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UnifiedUserSettings');
    return {
        __typename: 'TimeTracking_UnifiedUserSettings',
        locationTracking: overrides && overrides.hasOwnProperty('locationTracking') ? overrides.locationTracking! : relationshipsToOmit.has('TimeTracking_UnifiedUserLocationTracking') ? {} as TimeTracking_UnifiedUserLocationTracking : aTimeTracking_UnifiedUserLocationTracking({}, relationshipsToOmit),
        overtimeNotifications: overrides && overrides.hasOwnProperty('overtimeNotifications') ? overrides.overtimeNotifications! : relationshipsToOmit.has('TimeTracking_UnifiedUserOvertimeNotificationSettings') ? {} as TimeTracking_UnifiedUserOvertimeNotificationSettings : aTimeTracking_UnifiedUserOvertimeNotificationSettings({}, relationshipsToOmit),
        scheduleNotifications: overrides && overrides.hasOwnProperty('scheduleNotifications') ? overrides.scheduleNotifications! : relationshipsToOmit.has('TimeTracking_UnifiedUserScheduleNotificationSettings') ? {} as TimeTracking_UnifiedUserScheduleNotificationSettings : aTimeTracking_UnifiedUserScheduleNotificationSettings({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UnifiedUserSettingsInput = (overrides?: Partial<TimeTracking_UnifiedUserSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UnifiedUserSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UnifiedUserSettingsInput');
    return {
        settingsFor: overrides && overrides.hasOwnProperty('settingsFor') ? overrides.settingsFor! : relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UpdateApprovalSettingsError = (overrides?: Partial<TimeTracking_UpdateApprovalSettingsError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UpdateApprovalSettingsError' } & TimeTracking_UpdateApprovalSettingsError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateApprovalSettingsError');
    return {
        __typename: 'TimeTracking_UpdateApprovalSettingsError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'sit',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'natus',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'velit',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'omnis',
    };
};

export const aTimeTracking_UpdateApprovalSettingsInput = (overrides?: Partial<TimeTracking_UpdateApprovalSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateApprovalSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateApprovalSettingsInput');
    return {
        employee: overrides && overrides.hasOwnProperty('employee') ? overrides.employee! : relationshipsToOmit.has('TimeTracking_EmployeeApprovalSettingsInput') ? {} as TimeTracking_EmployeeApprovalSettingsInput : aTimeTracking_EmployeeApprovalSettingsInput({}, relationshipsToOmit),
        manager: overrides && overrides.hasOwnProperty('manager') ? overrides.manager! : relationshipsToOmit.has('TimeTracking_ManagerApprovalSettingsInput') ? {} as TimeTracking_ManagerApprovalSettingsInput : aTimeTracking_ManagerApprovalSettingsInput({}, relationshipsToOmit),
        submissionNotifications: overrides && overrides.hasOwnProperty('submissionNotifications') ? overrides.submissionNotifications! : relationshipsToOmit.has('TimeTracking_ApprovalSubmissionNotificationSettingsInput') ? {} as TimeTracking_ApprovalSubmissionNotificationSettingsInput : aTimeTracking_ApprovalSubmissionNotificationSettingsInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UpdateApprovalSettingsPayload = (overrides?: Partial<TimeTracking_UpdateApprovalSettingsPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UpdateApprovalSettingsPayload' } & TimeTracking_UpdateApprovalSettingsPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateApprovalSettingsPayload');
    return {
        __typename: 'TimeTracking_UpdateApprovalSettingsPayload',
        approvalSettings: overrides && overrides.hasOwnProperty('approvalSettings') ? overrides.approvalSettings! : relationshipsToOmit.has('TimeTracking_ApprovalSettings') ? {} as TimeTracking_ApprovalSettings : aTimeTracking_ApprovalSettings({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'ut',
    };
};

export const aTimeTracking_UpdateAttachmentInput = (overrides?: Partial<TimeTracking_UpdateAttachmentInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateAttachmentInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateAttachmentInput');
    return {
        description: overrides && overrides.hasOwnProperty('description') ? overrides.description! : 'dolor',
        documentId: overrides && overrides.hasOwnProperty('documentId') ? overrides.documentId! : 'vel',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'fd52389b-ad0e-4102-82ea-05018c4f5154',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'ut',
        orientationDegree: overrides && overrides.hasOwnProperty('orientationDegree') ? overrides.orientationDegree! : 272,
        sparse: overrides && overrides.hasOwnProperty('sparse') ? overrides.sparse! : false,
    };
};

export const aTimeTracking_UpdateAttachmentsInput = (overrides?: Partial<TimeTracking_UpdateAttachmentsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateAttachmentsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateAttachmentsInput');
    return {
        attachments: overrides && overrides.hasOwnProperty('attachments') ? overrides.attachments! : [relationshipsToOmit.has('TimeTracking_UpdateAttachmentInput') ? {} as TimeTracking_UpdateAttachmentInput : aTimeTracking_UpdateAttachmentInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_UpdateAttachmentsPayload = (overrides?: Partial<TimeTracking_UpdateAttachmentsPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UpdateAttachmentsPayload' } & TimeTracking_UpdateAttachmentsPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateAttachmentsPayload');
    return {
        __typename: 'TimeTracking_UpdateAttachmentsPayload',
        attachments: overrides && overrides.hasOwnProperty('attachments') ? overrides.attachments! : [relationshipsToOmit.has('TimeTracking_AttachmentInfo') ? {} as TimeTracking_AttachmentInfo : aTimeTracking_AttachmentInfo({}, relationshipsToOmit)],
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'doloremque',
    };
};

export const aTimeTracking_UpdateClockOutOverrideNotificationSettingsInput = (overrides?: Partial<TimeTracking_UpdateClockOutOverrideNotificationSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateClockOutOverrideNotificationSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateClockOutOverrideNotificationSettingsInput');
    return {
        adminEnabled: overrides && overrides.hasOwnProperty('adminEnabled') ? overrides.adminEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        groupManagerEnabled: overrides && overrides.hasOwnProperty('groupManagerEnabled') ? overrides.groupManagerEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UpdateCustomDimensionSettingInput = (overrides?: Partial<TimeTracking_UpdateCustomDimensionSettingInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateCustomDimensionSettingInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateCustomDimensionSettingInput');
    return {
        dimensionDefinitionId: overrides && overrides.hasOwnProperty('dimensionDefinitionId') ? overrides.dimensionDefinitionId! : 'fab383e3-6692-4ff4-8a81-95fc306e2a39',
        enabledForTimeTracking: overrides && overrides.hasOwnProperty('enabledForTimeTracking') ? overrides.enabledForTimeTracking! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        required: overrides && overrides.hasOwnProperty('required') ? overrides.required! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UpdateCustomFieldsSettingsInput = (overrides?: Partial<TimeTracking_UpdateCustomFieldsSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateCustomFieldsSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateCustomFieldsSettingsInput');
    return {
        classEnabled: overrides && overrides.hasOwnProperty('classEnabled') ? overrides.classEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        customDimensions: overrides && overrides.hasOwnProperty('customDimensions') ? overrides.customDimensions! : [relationshipsToOmit.has('TimeTracking_UpdateCustomDimensionSettingInput') ? {} as TimeTracking_UpdateCustomDimensionSettingInput : aTimeTracking_UpdateCustomDimensionSettingInput({}, relationshipsToOmit)],
        customersEnabled: overrides && overrides.hasOwnProperty('customersEnabled') ? overrides.customersEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        locationEnabled: overrides && overrides.hasOwnProperty('locationEnabled') ? overrides.locationEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UpdateEmployerSettingsError = (overrides?: Partial<TimeTracking_UpdateEmployerSettingsError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UpdateEmployerSettingsError' } & TimeTracking_UpdateEmployerSettingsError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateEmployerSettingsError');
    return {
        __typename: 'TimeTracking_UpdateEmployerSettingsError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'consectetur',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'molestiae',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'in',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'enim',
    };
};

export const aTimeTracking_UpdateEmployerSettingsInput = (overrides?: Partial<TimeTracking_UpdateEmployerSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateEmployerSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateEmployerSettingsInput');
    return {
        clockRoundingSettings: overrides && overrides.hasOwnProperty('clockRoundingSettings') ? overrides.clockRoundingSettings! : relationshipsToOmit.has('TimeTracking_TimesheetRoundingEmployerSettingsInput') ? {} as TimeTracking_TimesheetRoundingEmployerSettingsInput : aTimeTracking_TimesheetRoundingEmployerSettingsInput({}, relationshipsToOmit),
        coreSettings: overrides && overrides.hasOwnProperty('coreSettings') ? overrides.coreSettings! : relationshipsToOmit.has('TimeTracking_CoreEmployerSettingsInput') ? {} as TimeTracking_CoreEmployerSettingsInput : aTimeTracking_CoreEmployerSettingsInput({}, relationshipsToOmit),
        dateTimeSettings: overrides && overrides.hasOwnProperty('dateTimeSettings') ? overrides.dateTimeSettings! : relationshipsToOmit.has('TimeTracking_TimeAndDateEmployerSettingsInput') ? {} as TimeTracking_TimeAndDateEmployerSettingsInput : aTimeTracking_TimeAndDateEmployerSettingsInput({}, relationshipsToOmit),
        geofenceSettings: overrides && overrides.hasOwnProperty('geofenceSettings') ? overrides.geofenceSettings! : relationshipsToOmit.has('TimeTracking_GeofenceEmployerSettingsInput') ? {} as TimeTracking_GeofenceEmployerSettingsInput : aTimeTracking_GeofenceEmployerSettingsInput({}, relationshipsToOmit),
        kioskSettings: overrides && overrides.hasOwnProperty('kioskSettings') ? overrides.kioskSettings! : relationshipsToOmit.has('TimeTracking_KioskEmployerSettingsInput') ? {} as TimeTracking_KioskEmployerSettingsInput : aTimeTracking_KioskEmployerSettingsInput({}, relationshipsToOmit),
        notificationSettings: overrides && overrides.hasOwnProperty('notificationSettings') ? overrides.notificationSettings! : relationshipsToOmit.has('TimeTracking_NotificationEmployerSettingsInput') ? {} as TimeTracking_NotificationEmployerSettingsInput : aTimeTracking_NotificationEmployerSettingsInput({}, relationshipsToOmit),
        scheduleSettings: overrides && overrides.hasOwnProperty('scheduleSettings') ? overrides.scheduleSettings! : relationshipsToOmit.has('TimeTracking_ScheduleEmployerSettingsInput') ? {} as TimeTracking_ScheduleEmployerSettingsInput : aTimeTracking_ScheduleEmployerSettingsInput({}, relationshipsToOmit),
        timeTrackingBillingEnabled: overrides && overrides.hasOwnProperty('timeTrackingBillingEnabled') ? overrides.timeTrackingBillingEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        timeTrackingBillingRateForTimeEnabled: overrides && overrides.hasOwnProperty('timeTrackingBillingRateForTimeEnabled') ? overrides.timeTrackingBillingRateForTimeEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        timeTrackingStartWorkWeek: overrides && overrides.hasOwnProperty('timeTrackingStartWorkWeek') ? overrides.timeTrackingStartWorkWeek! : relationshipsToOmit.has('TimeTracking_UpdateSettingDayInput') ? {} as TimeTracking_UpdateSettingDayInput : aTimeTracking_UpdateSettingDayInput({}, relationshipsToOmit),
        timeTrackingUseItemForTimeEnabled: overrides && overrides.hasOwnProperty('timeTrackingUseItemForTimeEnabled') ? overrides.timeTrackingUseItemForTimeEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        timesheetManagementSettings: overrides && overrides.hasOwnProperty('timesheetManagementSettings') ? overrides.timesheetManagementSettings! : relationshipsToOmit.has('TimeTracking_TimesheetManagementEmployerSettingsInput') ? {} as TimeTracking_TimesheetManagementEmployerSettingsInput : aTimeTracking_TimesheetManagementEmployerSettingsInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UpdateEmployerSettingsPayload = (overrides?: Partial<TimeTracking_UpdateEmployerSettingsPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UpdateEmployerSettingsPayload' } & TimeTracking_UpdateEmployerSettingsPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateEmployerSettingsPayload');
    return {
        __typename: 'TimeTracking_UpdateEmployerSettingsPayload',
        employerSettings: overrides && overrides.hasOwnProperty('employerSettings') ? overrides.employerSettings! : relationshipsToOmit.has('TimeTracking_EmployerSettings') ? {} as TimeTracking_EmployerSettings : aTimeTracking_EmployerSettings({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'sapiente',
    };
};

export const aTimeTracking_UpdateGeofenceConfigurationError = (overrides?: Partial<TimeTracking_UpdateGeofenceConfigurationError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UpdateGeofenceConfigurationError' } & TimeTracking_UpdateGeofenceConfigurationError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateGeofenceConfigurationError');
    return {
        __typename: 'TimeTracking_UpdateGeofenceConfigurationError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'molestiae',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'doloremque',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'illo',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'magnam',
    };
};

export const aTimeTracking_UpdateGeofenceConfigurationInput = (overrides?: Partial<TimeTracking_UpdateGeofenceConfigurationInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateGeofenceConfigurationInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateGeofenceConfigurationInput');
    return {
        geofenceEnabled: overrides && overrides.hasOwnProperty('geofenceEnabled') ? overrides.geofenceEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        geofenceLocation: overrides && overrides.hasOwnProperty('geofenceLocation') ? overrides.geofenceLocation! : relationshipsToOmit.has('TimeTracking_UpdateGeofenceLocationInput') ? {} as TimeTracking_UpdateGeofenceLocationInput : aTimeTracking_UpdateGeofenceLocationInput({}, relationshipsToOmit),
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainstInput') ? {} as TimeTracking_TrackTimeAgainstInput : aTimeTracking_TrackTimeAgainstInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UpdateGeofenceConfigurationPayload = (overrides?: Partial<TimeTracking_UpdateGeofenceConfigurationPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UpdateGeofenceConfigurationPayload' } & TimeTracking_UpdateGeofenceConfigurationPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateGeofenceConfigurationPayload');
    return {
        __typename: 'TimeTracking_UpdateGeofenceConfigurationPayload',
        geofenceConfiguration: overrides && overrides.hasOwnProperty('geofenceConfiguration') ? overrides.geofenceConfiguration! : relationshipsToOmit.has('TimeTracking_GeofenceConfiguration') ? {} as TimeTracking_GeofenceConfiguration : aTimeTracking_GeofenceConfiguration({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'corrupti',
    };
};

export const aTimeTracking_UpdateGeofenceLocationInput = (overrides?: Partial<TimeTracking_UpdateGeofenceLocationInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateGeofenceLocationInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateGeofenceLocationInput');
    return {
        address1: overrides && overrides.hasOwnProperty('address1') ? overrides.address1! : 'illum',
        address2: overrides && overrides.hasOwnProperty('address2') ? overrides.address2! : 'accusamus',
        addressLabel: overrides && overrides.hasOwnProperty('addressLabel') ? overrides.addressLabel! : 'repudiandae',
        city: overrides && overrides.hasOwnProperty('city') ? overrides.city! : 'facilis',
        country: overrides && overrides.hasOwnProperty('country') ? overrides.country! : 'vero',
        formattedAddress: overrides && overrides.hasOwnProperty('formattedAddress') ? overrides.formattedAddress! : 'nam',
        geofenceRadiusInMeter: overrides && overrides.hasOwnProperty('geofenceRadiusInMeter') ? overrides.geofenceRadiusInMeter! : 3886,
        latitude: overrides && overrides.hasOwnProperty('latitude') ? overrides.latitude! : 'magni',
        longitude: overrides && overrides.hasOwnProperty('longitude') ? overrides.longitude! : 'nobis',
        placeId: overrides && overrides.hasOwnProperty('placeId') ? overrides.placeId! : 'velit',
        state: overrides && overrides.hasOwnProperty('state') ? overrides.state! : 'assumenda',
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'ullam',
        zipCode: overrides && overrides.hasOwnProperty('zipCode') ? overrides.zipCode! : 'sit',
    };
};

export const aTimeTracking_UpdateGeofenceReminderSettingsInput = (overrides?: Partial<TimeTracking_UpdateGeofenceReminderSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateGeofenceReminderSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateGeofenceReminderSettingsInput');
    return {
        daysOfWeek: overrides && overrides.hasOwnProperty('daysOfWeek') ? overrides.daysOfWeek! : relationshipsToOmit.has('TimeTracking_GeofenceReminderDaysOfWeekInput') ? {} as TimeTracking_GeofenceReminderDaysOfWeekInput : aTimeTracking_GeofenceReminderDaysOfWeekInput({}, relationshipsToOmit),
        endTime: overrides && overrides.hasOwnProperty('endTime') ? overrides.endTime! : relationshipsToOmit.has('TimeTracking_UpdateSettingStringInput') ? {} as TimeTracking_UpdateSettingStringInput : aTimeTracking_UpdateSettingStringInput({}, relationshipsToOmit),
        startTime: overrides && overrides.hasOwnProperty('startTime') ? overrides.startTime! : relationshipsToOmit.has('TimeTracking_UpdateSettingStringInput') ? {} as TimeTracking_UpdateSettingStringInput : aTimeTracking_UpdateSettingStringInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UpdateGroupError = (overrides?: Partial<TimeTracking_UpdateGroupError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UpdateGroupError' } & TimeTracking_UpdateGroupError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateGroupError');
    return {
        __typename: 'TimeTracking_UpdateGroupError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'perspiciatis',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'qui',
        groupId: overrides && overrides.hasOwnProperty('groupId') ? overrides.groupId! : 'sapiente',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'fugit',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'tempore',
    };
};

export const aTimeTracking_UpdateGroupInput = (overrides?: Partial<TimeTracking_UpdateGroupInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateGroupInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateGroupInput');
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'fd0c8ba2-01f6-42a8-bc51-7ea1f501e26a',
        name: overrides && overrides.hasOwnProperty('name') ? overrides.name! : 'veritatis',
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 7210,
    };
};

export const aTimeTracking_UpdateGroupPayload = (overrides?: Partial<TimeTracking_UpdateGroupPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UpdateGroupPayload' } & TimeTracking_UpdateGroupPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateGroupPayload');
    return {
        __typename: 'TimeTracking_UpdateGroupPayload',
        group: overrides && overrides.hasOwnProperty('group') ? overrides.group! : relationshipsToOmit.has('TimeTracking_Group') ? {} as TimeTracking_Group : aTimeTracking_Group({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'ullam',
    };
};

export const aTimeTracking_UpdateOvertimeNotificationRuleInput = (overrides?: Partial<TimeTracking_UpdateOvertimeNotificationRuleInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateOvertimeNotificationRuleInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateOvertimeNotificationRuleInput');
    return {
        alertFrequency: overrides && overrides.hasOwnProperty('alertFrequency') ? overrides.alertFrequency! : relationshipsToOmit.has('TimeTracking_OvertimeAlertFrequencyInput') ? {} as TimeTracking_OvertimeAlertFrequencyInput : aTimeTracking_OvertimeAlertFrequencyInput({}, relationshipsToOmit),
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'ea122d77-79c7-4ed6-ba69-6b8320bd37d9',
        recipients: overrides && overrides.hasOwnProperty('recipients') ? overrides.recipients! : relationshipsToOmit.has('TimeTracking_OvertimeAlertRecipientsInput') ? {} as TimeTracking_OvertimeAlertRecipientsInput : aTimeTracking_OvertimeAlertRecipientsInput({}, relationshipsToOmit),
        threshold: overrides && overrides.hasOwnProperty('threshold') ? overrides.threshold! : relationshipsToOmit.has('TimeTracking_OvertimeThresholdInput') ? {} as TimeTracking_OvertimeThresholdInput : aTimeTracking_OvertimeThresholdInput({}, relationshipsToOmit),
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'ut',
    };
};

export const aTimeTracking_UpdateOvertimeNotificationSettingsInput = (overrides?: Partial<TimeTracking_UpdateOvertimeNotificationSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateOvertimeNotificationSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateOvertimeNotificationSettingsInput');
    return {
        create: overrides && overrides.hasOwnProperty('create') ? overrides.create! : [relationshipsToOmit.has('TimeTracking_CreateOvertimeNotificationRuleInput') ? {} as TimeTracking_CreateOvertimeNotificationRuleInput : aTimeTracking_CreateOvertimeNotificationRuleInput({}, relationshipsToOmit)],
        delete: overrides && overrides.hasOwnProperty('delete') ? overrides.delete! : ['cb03c2a6-5e54-4295-afe2-14843487804b'],
        update: overrides && overrides.hasOwnProperty('update') ? overrides.update! : [relationshipsToOmit.has('TimeTracking_UpdateOvertimeNotificationRuleInput') ? {} as TimeTracking_UpdateOvertimeNotificationRuleInput : aTimeTracking_UpdateOvertimeNotificationRuleInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_UpdateProjectEstimateError = (overrides?: Partial<TimeTracking_UpdateProjectEstimateError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UpdateProjectEstimateError' } & TimeTracking_UpdateProjectEstimateError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateProjectEstimateError');
    return {
        __typename: 'TimeTracking_UpdateProjectEstimateError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'iusto',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'voluptatem',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'reprehenderit',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'sapiente',
    };
};

export const aTimeTracking_UpdateProjectEstimateInput = (overrides?: Partial<TimeTracking_UpdateProjectEstimateInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateProjectEstimateInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateProjectEstimateInput');
    return {
        fieldOptionEstimates: overrides && overrides.hasOwnProperty('fieldOptionEstimates') ? overrides.fieldOptionEstimates! : [relationshipsToOmit.has('TimeTracking_FieldOptionEstimateInput') ? {} as TimeTracking_FieldOptionEstimateInput : aTimeTracking_FieldOptionEstimateInput({}, relationshipsToOmit)],
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : 'b69355ce-d26f-4eeb-9ef8-895482ae1d85',
        totalEstimatedSeconds: overrides && overrides.hasOwnProperty('totalEstimatedSeconds') ? overrides.totalEstimatedSeconds! : 'enim',
    };
};

export const aTimeTracking_UpdateProjectEstimatePayload = (overrides?: Partial<TimeTracking_UpdateProjectEstimatePayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UpdateProjectEstimatePayload' } & TimeTracking_UpdateProjectEstimatePayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateProjectEstimatePayload');
    return {
        __typename: 'TimeTracking_UpdateProjectEstimatePayload',
        projectEstimate: overrides && overrides.hasOwnProperty('projectEstimate') ? overrides.projectEstimate! : relationshipsToOmit.has('TimeTracking_ProjectEstimate') ? {} as TimeTracking_ProjectEstimate : aTimeTracking_ProjectEstimate({}, relationshipsToOmit),
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'est',
    };
};

export const aTimeTracking_UpdateScheduleNotificationSettingsInput = (overrides?: Partial<TimeTracking_UpdateScheduleNotificationSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateScheduleNotificationSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateScheduleNotificationSettingsInput');
    return {
        publishShiftChangePreference: overrides && overrides.hasOwnProperty('publishShiftChangePreference') ? overrides.publishShiftChangePreference! : relationshipsToOmit.has('TimeTracking_UpdateSettingScheduleShiftChangePreferenceInput') ? {} as TimeTracking_UpdateSettingScheduleShiftChangePreferenceInput : aTimeTracking_UpdateSettingScheduleShiftChangePreferenceInput({}, relationshipsToOmit),
        subscriptions: overrides && overrides.hasOwnProperty('subscriptions') ? overrides.subscriptions! : [relationshipsToOmit.has('TimeTracking_NotificationSubscriptionInput') ? {} as TimeTracking_NotificationSubscriptionInput : aTimeTracking_NotificationSubscriptionInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_UpdateSettingApprovalReminderBasisInput = (overrides?: Partial<TimeTracking_UpdateSettingApprovalReminderBasisInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateSettingApprovalReminderBasisInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateSettingApprovalReminderBasisInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : TimeTracking_ApprovalReminderBasis.Daily,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'laudantium',
    };
};

export const aTimeTracking_UpdateSettingApprovalReminderMediumInput = (overrides?: Partial<TimeTracking_UpdateSettingApprovalReminderMediumInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateSettingApprovalReminderMediumInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateSettingApprovalReminderMediumInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : [TimeTracking_NotificationReminderMedium.Email],
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'vel',
    };
};

export const aTimeTracking_UpdateSettingBooleanInput = (overrides?: Partial<TimeTracking_UpdateSettingBooleanInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateSettingBooleanInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateSettingBooleanInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : false,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'esse',
    };
};

export const aTimeTracking_UpdateSettingDayInput = (overrides?: Partial<TimeTracking_UpdateSettingDayInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateSettingDayInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateSettingDayInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : Common_DayOfWeek.Friday,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'sit',
    };
};

export const aTimeTracking_UpdateSettingIntegerInput = (overrides?: Partial<TimeTracking_UpdateSettingIntegerInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateSettingIntegerInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateSettingIntegerInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : 8161,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'voluptates',
    };
};

export const aTimeTracking_UpdateSettingLocationTrackingInput = (overrides?: Partial<TimeTracking_UpdateSettingLocationTrackingInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateSettingLocationTrackingInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateSettingLocationTrackingInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : TimeTracking_LocationTrackingType.Off,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'fugiat',
    };
};

export const aTimeTracking_UpdateSettingNotificationMediumInput = (overrides?: Partial<TimeTracking_UpdateSettingNotificationMediumInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateSettingNotificationMediumInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateSettingNotificationMediumInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : [TimeTracking_NotificationReminderMedium.Email],
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'in',
    };
};

export const aTimeTracking_UpdateSettingNotificationReminderDaysInput = (overrides?: Partial<TimeTracking_UpdateSettingNotificationReminderDaysInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateSettingNotificationReminderDaysInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateSettingNotificationReminderDaysInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : [Common_DayOfWeek.Friday],
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'architecto',
    };
};

export const aTimeTracking_UpdateSettingScheduleManageInput = (overrides?: Partial<TimeTracking_UpdateSettingScheduleManageInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateSettingScheduleManageInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateSettingScheduleManageInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : TimeTracking_ScheduleManagePreference.Company,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'quia',
    };
};

export const aTimeTracking_UpdateSettingScheduleShiftChangePreferenceInput = (overrides?: Partial<TimeTracking_UpdateSettingScheduleShiftChangePreferenceInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateSettingScheduleShiftChangePreferenceInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateSettingScheduleShiftChangePreferenceInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : TimeTracking_ScheduleShiftChangeNotificationPreference.Always,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'dicta',
    };
};

export const aTimeTracking_UpdateSettingScheduleViewInput = (overrides?: Partial<TimeTracking_UpdateSettingScheduleViewInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateSettingScheduleViewInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateSettingScheduleViewInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : TimeTracking_ScheduleViewPreference.Company,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'fugit',
    };
};

export const aTimeTracking_UpdateSettingStringInput = (overrides?: Partial<TimeTracking_UpdateSettingStringInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateSettingStringInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateSettingStringInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : 'quidem',
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'sed',
    };
};

export const aTimeTracking_UpdateShiftNotificationSettingsInput = (overrides?: Partial<TimeTracking_UpdateShiftNotificationSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateShiftNotificationSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateShiftNotificationSettingsInput');
    return {
        notificationMedium: overrides && overrides.hasOwnProperty('notificationMedium') ? overrides.notificationMedium! : relationshipsToOmit.has('TimeTracking_UpdateSettingNotificationMediumInput') ? {} as TimeTracking_UpdateSettingNotificationMediumInput : aTimeTracking_UpdateSettingNotificationMediumInput({}, relationshipsToOmit),
        reminderTime: overrides && overrides.hasOwnProperty('reminderTime') ? overrides.reminderTime! : relationshipsToOmit.has('TimeTracking_UpdateSettingStringInput') ? {} as TimeTracking_UpdateSettingStringInput : aTimeTracking_UpdateSettingStringInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UpdateTimeEntryError = (overrides?: Partial<TimeTracking_UpdateTimeEntryError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UpdateTimeEntryError' } & TimeTracking_UpdateTimeEntryError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateTimeEntryError');
    return {
        __typename: 'TimeTracking_UpdateTimeEntryError',
        detailLocalizationArgs: overrides && overrides.hasOwnProperty('detailLocalizationArgs') ? overrides.detailLocalizationArgs! : ['itaque'],
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'quam',
        element: overrides && overrides.hasOwnProperty('element') ? overrides.element! : 'occaecati',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'perspiciatis',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'nesciunt',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'in',
    };
};

export const aTimeTracking_UpdateTimeEntryInput = (overrides?: Partial<TimeTracking_UpdateTimeEntryInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateTimeEntryInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateTimeEntryInput');
    return {
        billableRate: overrides && overrides.hasOwnProperty('billableRate') ? overrides.billableRate! : 'omnis',
        billableStatus: overrides && overrides.hasOwnProperty('billableStatus') ? overrides.billableStatus! : TimeTracking_BillableStatus.Billable,
        classID: overrides && overrides.hasOwnProperty('classID') ? overrides.classID! : 'e6fad905-d068-499c-b0e5-e2a10dd7b3f9',
        closedBookPassword: overrides && overrides.hasOwnProperty('closedBookPassword') ? overrides.closedBookPassword! : 'non',
        costRate: overrides && overrides.hasOwnProperty('costRate') ? overrides.costRate! : 'enim',
        customExtensions: overrides && overrides.hasOwnProperty('customExtensions') ? overrides.customExtensions! : relationshipsToOmit.has('TimeTracking_CustomExtensionsInput') ? {} as TimeTracking_CustomExtensionsInput : aTimeTracking_CustomExtensionsInput({}, relationshipsToOmit),
        customFields: overrides && overrides.hasOwnProperty('customFields') ? overrides.customFields! : [relationshipsToOmit.has('TimeTracking_CustomFieldInput') ? {} as TimeTracking_CustomFieldInput : aTimeTracking_CustomFieldInput({}, relationshipsToOmit)],
        date: overrides && overrides.hasOwnProperty('date') ? overrides.date! : '1970-01-05T21:23:55.587Z',
        departmentID: overrides && overrides.hasOwnProperty('departmentID') ? overrides.departmentID! : '5caea4b3-95c9-454b-8434-e9e43a878f6c',
        departmentLabel: overrides && overrides.hasOwnProperty('departmentLabel') ? overrides.departmentLabel! : 'tenetur',
        distanceTracking: overrides && overrides.hasOwnProperty('distanceTracking') ? overrides.distanceTracking! : relationshipsToOmit.has('TimeTracking_DistanceTrackingUpdateInput') ? {} as TimeTracking_DistanceTrackingUpdateInput : aTimeTracking_DistanceTrackingUpdateInput({}, relationshipsToOmit),
        duration: overrides && overrides.hasOwnProperty('duration') ? overrides.duration! : 8721,
        endTime: overrides && overrides.hasOwnProperty('endTime') ? overrides.endTime! : 'id',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '6e938345-8ca2-4886-92a1-3d22a9184e84',
        isExported: overrides && overrides.hasOwnProperty('isExported') ? overrides.isExported! : false,
        notes: overrides && overrides.hasOwnProperty('notes') ? overrides.notes! : 'cum',
        payrollItemID: overrides && overrides.hasOwnProperty('payrollItemID') ? overrides.payrollItemID! : '728d5381-7854-408c-9054-52620b49fa91',
        serviceItemID: overrides && overrides.hasOwnProperty('serviceItemID') ? overrides.serviceItemID! : '76ade3b2-ddff-4673-b5f2-3f022b9a9dc6',
        sparse: overrides && overrides.hasOwnProperty('sparse') ? overrides.sparse! : false,
        startTime: overrides && overrides.hasOwnProperty('startTime') ? overrides.startTime! : 'voluptas',
        taxable: overrides && overrides.hasOwnProperty('taxable') ? overrides.taxable! : true,
        timeAgainst: overrides && overrides.hasOwnProperty('timeAgainst') ? overrides.timeAgainst! : relationshipsToOmit.has('TimeTracking_TrackTimeAgainstInput') ? {} as TimeTracking_TrackTimeAgainstInput : aTimeTracking_TrackTimeAgainstInput({}, relationshipsToOmit),
        timeBreakId: overrides && overrides.hasOwnProperty('timeBreakId') ? overrides.timeBreakId! : 'd00908e5-68e3-41f8-bf2e-e98b2aba78f7',
        timeFor: overrides && overrides.hasOwnProperty('timeFor') ? overrides.timeFor! : relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit),
        timeZone: overrides && overrides.hasOwnProperty('timeZone') ? overrides.timeZone! : 'eos',
        v3BreakDuration: overrides && overrides.hasOwnProperty('v3BreakDuration') ? overrides.v3BreakDuration! : 5490,
        v3BreakDurationDetails: overrides && overrides.hasOwnProperty('v3BreakDurationDetails') ? overrides.v3BreakDurationDetails! : relationshipsToOmit.has('TimeTracking_V3BreakDurationDetailsInput') ? {} as TimeTracking_V3BreakDurationDetailsInput : aTimeTracking_V3BreakDurationDetailsInput({}, relationshipsToOmit),
        v3DurationDetails: overrides && overrides.hasOwnProperty('v3DurationDetails') ? overrides.v3DurationDetails! : relationshipsToOmit.has('TimeTracking_V3DurationDetailsInput') ? {} as TimeTracking_V3DurationDetailsInput : aTimeTracking_V3DurationDetailsInput({}, relationshipsToOmit),
        v3TransactionLocationType: overrides && overrides.hasOwnProperty('v3TransactionLocationType') ? overrides.v3TransactionLocationType! : TimeTracking_V3TransactionLocationType.FranceOverseas,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'consequatur',
    };
};

export const aTimeTracking_UpdateTimeEntryPayload = (overrides?: Partial<TimeTracking_UpdateTimeEntryPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UpdateTimeEntryPayload' } & TimeTracking_UpdateTimeEntryPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateTimeEntryPayload');
    return {
        __typename: 'TimeTracking_UpdateTimeEntryPayload',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'asperiores',
        timeEntries: overrides && overrides.hasOwnProperty('timeEntries') ? overrides.timeEntries! : [relationshipsToOmit.has('TimeTracking_TimeEntry') ? {} as TimeTracking_TimeEntry : aTimeTracking_TimeEntry({}, relationshipsToOmit)],
        timeEntry: overrides && overrides.hasOwnProperty('timeEntry') ? overrides.timeEntry! : relationshipsToOmit.has('TimeTracking_TimeEntry') ? {} as TimeTracking_TimeEntry : aTimeTracking_TimeEntry({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UpdateTimeSheetEditNotificationSettingsInput = (overrides?: Partial<TimeTracking_UpdateTimeSheetEditNotificationSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateTimeSheetEditNotificationSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateTimeSheetEditNotificationSettingsInput');
    return {
        adminEnabled: overrides && overrides.hasOwnProperty('adminEnabled') ? overrides.adminEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
        groupManagerEnabled: overrides && overrides.hasOwnProperty('groupManagerEnabled') ? overrides.groupManagerEnabled! : relationshipsToOmit.has('TimeTracking_UpdateSettingBooleanInput') ? {} as TimeTracking_UpdateSettingBooleanInput : aTimeTracking_UpdateSettingBooleanInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UpdateUnifiedUserScheduleNotificationSettingsInput = (overrides?: Partial<TimeTracking_UpdateUnifiedUserScheduleNotificationSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateUnifiedUserScheduleNotificationSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateUnifiedUserScheduleNotificationSettingsInput');
    return {
        reset: overrides && overrides.hasOwnProperty('reset') ? overrides.reset! : true,
        subscriptions: overrides && overrides.hasOwnProperty('subscriptions') ? overrides.subscriptions! : [relationshipsToOmit.has('TimeTracking_NotificationSubscriptionInput') ? {} as TimeTracking_NotificationSubscriptionInput : aTimeTracking_NotificationSubscriptionInput({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_UpdateUserLocationTrackingInput = (overrides?: Partial<TimeTracking_UpdateUserLocationTrackingInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateUserLocationTrackingInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateUserLocationTrackingInput');
    return {
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : TimeTracking_UserLocationTrackingType.Off,
        version: overrides && overrides.hasOwnProperty('version') ? overrides.version! : 'pariatur',
    };
};

export const aTimeTracking_UpdateWorkerPermissionsError = (overrides?: Partial<TimeTracking_UpdateWorkerPermissionsError>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UpdateWorkerPermissionsError' } & TimeTracking_UpdateWorkerPermissionsError => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateWorkerPermissionsError');
    return {
        __typename: 'TimeTracking_UpdateWorkerPermissionsError',
        details: overrides && overrides.hasOwnProperty('details') ? overrides.details! : 'laudantium',
        errorCode: overrides && overrides.hasOwnProperty('errorCode') ? overrides.errorCode! : 'tempora',
        message: overrides && overrides.hasOwnProperty('message') ? overrides.message! : 'distinctio',
        subCode: overrides && overrides.hasOwnProperty('subCode') ? overrides.subCode! : 'occaecati',
    };
};

export const aTimeTracking_UpdateWorkerPermissionsInput = (overrides?: Partial<TimeTracking_UpdateWorkerPermissionsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UpdateWorkerPermissionsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateWorkerPermissionsInput');
    return {
        admin: overrides && overrides.hasOwnProperty('admin') ? overrides.admin! : true,
        featurePermissions: overrides && overrides.hasOwnProperty('featurePermissions') ? overrides.featurePermissions! : relationshipsToOmit.has('TimeTracking_FeaturePermissionsInput') ? {} as TimeTracking_FeaturePermissionsInput : aTimeTracking_FeaturePermissionsInput({}, relationshipsToOmit),
        managementPermissions: overrides && overrides.hasOwnProperty('managementPermissions') ? overrides.managementPermissions! : relationshipsToOmit.has('TimeTracking_ManagementPermissionsInput') ? {} as TimeTracking_ManagementPermissionsInput : aTimeTracking_ManagementPermissionsInput({}, relationshipsToOmit),
        projectPermission: overrides && overrides.hasOwnProperty('projectPermission') ? overrides.projectPermission! : TimeTracking_ProjectPermission.Manage,
        schedulePermissions: overrides && overrides.hasOwnProperty('schedulePermissions') ? overrides.schedulePermissions! : relationshipsToOmit.has('TimeTracking_SchedulePermissionsInput') ? {} as TimeTracking_SchedulePermissionsInput : aTimeTracking_SchedulePermissionsInput({}, relationshipsToOmit),
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : '28df8ab7-8d43-403a-a745-f88344864e4f',
        workerType: overrides && overrides.hasOwnProperty('workerType') ? overrides.workerType! : TimeTracking_TimeForType.Employee,
    };
};

export const aTimeTracking_UpdateWorkerPermissionsPayload = (overrides?: Partial<TimeTracking_UpdateWorkerPermissionsPayload>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UpdateWorkerPermissionsPayload' } & TimeTracking_UpdateWorkerPermissionsPayload => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UpdateWorkerPermissionsPayload');
    return {
        __typename: 'TimeTracking_UpdateWorkerPermissionsPayload',
        successCode: overrides && overrides.hasOwnProperty('successCode') ? overrides.successCode! : 'aut',
        workerPermissions: overrides && overrides.hasOwnProperty('workerPermissions') ? overrides.workerPermissions! : relationshipsToOmit.has('TimeTracking_WorkerPermissions') ? {} as TimeTracking_WorkerPermissions : aTimeTracking_WorkerPermissions({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UserSettingNotificationReminderDays = (overrides?: Partial<TimeTracking_UserSettingNotificationReminderDays>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UserSettingNotificationReminderDays' } & TimeTracking_UserSettingNotificationReminderDays => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UserSettingNotificationReminderDays');
    return {
        __typename: 'TimeTracking_UserSettingNotificationReminderDays',
        active: overrides && overrides.hasOwnProperty('active') ? overrides.active! : false,
        meta: overrides && overrides.hasOwnProperty('meta') ? overrides.meta! : relationshipsToOmit.has('TimeTracking_SettingMeta') ? {} as TimeTracking_SettingMeta : aTimeTracking_SettingMeta({}, relationshipsToOmit),
        value: overrides && overrides.hasOwnProperty('value') ? overrides.value! : [Common_DayOfWeek.Friday],
    };
};

export const aTimeTracking_UserSettings = (overrides?: Partial<TimeTracking_UserSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UserSettings' } & TimeTracking_UserSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UserSettings');
    return {
        __typename: 'TimeTracking_UserSettings',
        clockInSetting: overrides && overrides.hasOwnProperty('clockInSetting') ? overrides.clockInSetting! : relationshipsToOmit.has('TimeTracking_UserShiftNotificationSettings') ? {} as TimeTracking_UserShiftNotificationSettings : aTimeTracking_UserShiftNotificationSettings({}, relationshipsToOmit),
        clockOutSetting: overrides && overrides.hasOwnProperty('clockOutSetting') ? overrides.clockOutSetting! : relationshipsToOmit.has('TimeTracking_UserShiftNotificationSettings') ? {} as TimeTracking_UserShiftNotificationSettings : aTimeTracking_UserShiftNotificationSettings({}, relationshipsToOmit),
        notificationEnabledForDays: overrides && overrides.hasOwnProperty('notificationEnabledForDays') ? overrides.notificationEnabledForDays! : relationshipsToOmit.has('TimeTracking_UserSettingNotificationReminderDays') ? {} as TimeTracking_UserSettingNotificationReminderDays : aTimeTracking_UserSettingNotificationReminderDays({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UserSettingsInput = (overrides?: Partial<TimeTracking_UserSettingsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_UserSettingsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UserSettingsInput');
    return {
        settingsFor: overrides && overrides.hasOwnProperty('settingsFor') ? overrides.settingsFor! : relationshipsToOmit.has('TimeTracking_TimeForInput') ? {} as TimeTracking_TimeForInput : aTimeTracking_TimeForInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_UserShiftNotificationSettings = (overrides?: Partial<TimeTracking_UserShiftNotificationSettings>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_UserShiftNotificationSettings' } & TimeTracking_UserShiftNotificationSettings => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_UserShiftNotificationSettings');
    return {
        __typename: 'TimeTracking_UserShiftNotificationSettings',
        active: overrides && overrides.hasOwnProperty('active') ? overrides.active! : true,
        notificationMedium: overrides && overrides.hasOwnProperty('notificationMedium') ? overrides.notificationMedium! : relationshipsToOmit.has('TimeTracking_SettingNotificationMedium') ? {} as TimeTracking_SettingNotificationMedium : aTimeTracking_SettingNotificationMedium({}, relationshipsToOmit),
        reminderTime: overrides && overrides.hasOwnProperty('reminderTime') ? overrides.reminderTime! : relationshipsToOmit.has('TimeTracking_SettingString') ? {} as TimeTracking_SettingString : aTimeTracking_SettingString({}, relationshipsToOmit),
    };
};

export const aTimeTracking_V3BillableStatusFilter = (overrides?: Partial<TimeTracking_V3BillableStatusFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_V3BillableStatusFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_V3BillableStatusFilter');
    return {
        equals: overrides && overrides.hasOwnProperty('equals') ? overrides.equals! : TimeTracking_BillableStatus.Billable,
        greaterThan: overrides && overrides.hasOwnProperty('greaterThan') ? overrides.greaterThan! : TimeTracking_BillableStatus.Billable,
        greaterThanOrEquals: overrides && overrides.hasOwnProperty('greaterThanOrEquals') ? overrides.greaterThanOrEquals! : TimeTracking_BillableStatus.Billable,
        lessThan: overrides && overrides.hasOwnProperty('lessThan') ? overrides.lessThan! : TimeTracking_BillableStatus.Billable,
        lessThanOrEquals: overrides && overrides.hasOwnProperty('lessThanOrEquals') ? overrides.lessThanOrEquals! : TimeTracking_BillableStatus.Billable,
        like: overrides && overrides.hasOwnProperty('like') ? overrides.like! : TimeTracking_BillableStatus.Billable,
        matchesAny: overrides && overrides.hasOwnProperty('matchesAny') ? overrides.matchesAny! : [TimeTracking_BillableStatus.Billable],
        notEquals: overrides && overrides.hasOwnProperty('notEquals') ? overrides.notEquals! : TimeTracking_BillableStatus.Billable,
    };
};

export const aTimeTracking_V3BooleanFilter = (overrides?: Partial<TimeTracking_V3BooleanFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_V3BooleanFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_V3BooleanFilter');
    return {
        equals: overrides && overrides.hasOwnProperty('equals') ? overrides.equals! : false,
        greaterThan: overrides && overrides.hasOwnProperty('greaterThan') ? overrides.greaterThan! : true,
        greaterThanOrEquals: overrides && overrides.hasOwnProperty('greaterThanOrEquals') ? overrides.greaterThanOrEquals! : true,
        lessThan: overrides && overrides.hasOwnProperty('lessThan') ? overrides.lessThan! : true,
        lessThanOrEquals: overrides && overrides.hasOwnProperty('lessThanOrEquals') ? overrides.lessThanOrEquals! : false,
        like: overrides && overrides.hasOwnProperty('like') ? overrides.like! : false,
        matchesAny: overrides && overrides.hasOwnProperty('matchesAny') ? overrides.matchesAny! : [true],
        notEquals: overrides && overrides.hasOwnProperty('notEquals') ? overrides.notEquals! : false,
    };
};

export const aTimeTracking_V3BreakDurationDetails = (overrides?: Partial<TimeTracking_V3BreakDurationDetails>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_V3BreakDurationDetails' } & TimeTracking_V3BreakDurationDetails => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_V3BreakDurationDetails');
    return {
        __typename: 'TimeTracking_V3BreakDurationDetails',
        hours: overrides && overrides.hasOwnProperty('hours') ? overrides.hours! : 9663,
        minutes: overrides && overrides.hasOwnProperty('minutes') ? overrides.minutes! : 4331,
        seconds: overrides && overrides.hasOwnProperty('seconds') ? overrides.seconds! : 1262,
    };
};

export const aTimeTracking_V3BreakDurationDetailsInput = (overrides?: Partial<TimeTracking_V3BreakDurationDetailsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_V3BreakDurationDetailsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_V3BreakDurationDetailsInput');
    return {
        hours: overrides && overrides.hasOwnProperty('hours') ? overrides.hours! : 1693,
        minutes: overrides && overrides.hasOwnProperty('minutes') ? overrides.minutes! : 88,
        seconds: overrides && overrides.hasOwnProperty('seconds') ? overrides.seconds! : 2136,
    };
};

export const aTimeTracking_V3DateFilter = (overrides?: Partial<TimeTracking_V3DateFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_V3DateFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_V3DateFilter');
    return {
        after: overrides && overrides.hasOwnProperty('after') ? overrides.after! : '1970-01-04T05:42:56.209Z',
        before: overrides && overrides.hasOwnProperty('before') ? overrides.before! : '1970-01-04T07:20:20.637Z',
        equals: overrides && overrides.hasOwnProperty('equals') ? overrides.equals! : '1970-01-15T02:32:26.595Z',
        matchesAny: overrides && overrides.hasOwnProperty('matchesAny') ? overrides.matchesAny! : ['1970-01-10T00:45:03.743Z'],
        notEquals: overrides && overrides.hasOwnProperty('notEquals') ? overrides.notEquals! : '1970-01-14T21:58:24.061Z',
        onOrAfter: overrides && overrides.hasOwnProperty('onOrAfter') ? overrides.onOrAfter! : '1970-01-03T18:05:59.700Z',
        onOrBefore: overrides && overrides.hasOwnProperty('onOrBefore') ? overrides.onOrBefore! : '1970-01-12T06:47:16.663Z',
    };
};

export const aTimeTracking_V3DateTimeFilter = (overrides?: Partial<TimeTracking_V3DateTimeFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_V3DateTimeFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_V3DateTimeFilter');
    return {
        after: overrides && overrides.hasOwnProperty('after') ? overrides.after! : 'error',
        before: overrides && overrides.hasOwnProperty('before') ? overrides.before! : 'et',
        equals: overrides && overrides.hasOwnProperty('equals') ? overrides.equals! : 'quae',
        matchesAny: overrides && overrides.hasOwnProperty('matchesAny') ? overrides.matchesAny! : ['et'],
        notEquals: overrides && overrides.hasOwnProperty('notEquals') ? overrides.notEquals! : 'mollitia',
        onOrAfter: overrides && overrides.hasOwnProperty('onOrAfter') ? overrides.onOrAfter! : 'omnis',
        onOrBefore: overrides && overrides.hasOwnProperty('onOrBefore') ? overrides.onOrBefore! : 'ut',
    };
};

export const aTimeTracking_V3DecimalFilter = (overrides?: Partial<TimeTracking_V3DecimalFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_V3DecimalFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_V3DecimalFilter');
    return {
        equals: overrides && overrides.hasOwnProperty('equals') ? overrides.equals! : 'autem',
        greaterThan: overrides && overrides.hasOwnProperty('greaterThan') ? overrides.greaterThan! : 'aut',
        greaterThanOrEquals: overrides && overrides.hasOwnProperty('greaterThanOrEquals') ? overrides.greaterThanOrEquals! : 'vel',
        lessThan: overrides && overrides.hasOwnProperty('lessThan') ? overrides.lessThan! : 'illo',
        lessThanOrEquals: overrides && overrides.hasOwnProperty('lessThanOrEquals') ? overrides.lessThanOrEquals! : 'ut',
        like: overrides && overrides.hasOwnProperty('like') ? overrides.like! : 'ut',
        matchesAny: overrides && overrides.hasOwnProperty('matchesAny') ? overrides.matchesAny! : ['id'],
        notEquals: overrides && overrides.hasOwnProperty('notEquals') ? overrides.notEquals! : 'iusto',
    };
};

export const aTimeTracking_V3DurationDetails = (overrides?: Partial<TimeTracking_V3DurationDetails>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_V3DurationDetails' } & TimeTracking_V3DurationDetails => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_V3DurationDetails');
    return {
        __typename: 'TimeTracking_V3DurationDetails',
        hours: overrides && overrides.hasOwnProperty('hours') ? overrides.hours! : 6271,
        minutes: overrides && overrides.hasOwnProperty('minutes') ? overrides.minutes! : 873,
        seconds: overrides && overrides.hasOwnProperty('seconds') ? overrides.seconds! : 213,
    };
};

export const aTimeTracking_V3DurationDetailsInput = (overrides?: Partial<TimeTracking_V3DurationDetailsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_V3DurationDetailsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_V3DurationDetailsInput');
    return {
        hours: overrides && overrides.hasOwnProperty('hours') ? overrides.hours! : 2711,
        minutes: overrides && overrides.hasOwnProperty('minutes') ? overrides.minutes! : 5370,
        seconds: overrides && overrides.hasOwnProperty('seconds') ? overrides.seconds! : 9590,
    };
};

export const aTimeTracking_V3IdFilter = (overrides?: Partial<TimeTracking_V3IdFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_V3IdFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_V3IdFilter');
    return {
        equals: overrides && overrides.hasOwnProperty('equals') ? overrides.equals! : '13d35b35-c233-49b3-8fa4-74a5eb81c461',
        greaterThan: overrides && overrides.hasOwnProperty('greaterThan') ? overrides.greaterThan! : '937b534a-c8b9-45ae-b99c-2bbca39cbd67',
        greaterThanOrEquals: overrides && overrides.hasOwnProperty('greaterThanOrEquals') ? overrides.greaterThanOrEquals! : '045fe8d2-20e2-49c0-a413-857c29b8297b',
        isNull: overrides && overrides.hasOwnProperty('isNull') ? overrides.isNull! : false,
        lessThan: overrides && overrides.hasOwnProperty('lessThan') ? overrides.lessThan! : 'd82c775e-142a-4a35-9123-6b7adc60b851',
        lessThanOrEquals: overrides && overrides.hasOwnProperty('lessThanOrEquals') ? overrides.lessThanOrEquals! : '473342c9-b4ec-4b74-a525-d0b0fa5de0f6',
        like: overrides && overrides.hasOwnProperty('like') ? overrides.like! : '6b4da3d5-8fc2-4b5e-8e1d-66a80a6720d1',
        matchesAny: overrides && overrides.hasOwnProperty('matchesAny') ? overrides.matchesAny! : ['0ff3807b-2471-4d09-8c80-07808c56c71b'],
        notEquals: overrides && overrides.hasOwnProperty('notEquals') ? overrides.notEquals! : '6435dde2-03c5-4d13-8a6a-e741131bb03c',
    };
};

export const aTimeTracking_V3IntFilter = (overrides?: Partial<TimeTracking_V3IntFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_V3IntFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_V3IntFilter');
    return {
        equals: overrides && overrides.hasOwnProperty('equals') ? overrides.equals! : 9229,
        greaterThan: overrides && overrides.hasOwnProperty('greaterThan') ? overrides.greaterThan! : 213,
        greaterThanOrEquals: overrides && overrides.hasOwnProperty('greaterThanOrEquals') ? overrides.greaterThanOrEquals! : 3799,
        lessThan: overrides && overrides.hasOwnProperty('lessThan') ? overrides.lessThan! : 2544,
        lessThanOrEquals: overrides && overrides.hasOwnProperty('lessThanOrEquals') ? overrides.lessThanOrEquals! : 9764,
        like: overrides && overrides.hasOwnProperty('like') ? overrides.like! : 8967,
        matchesAny: overrides && overrides.hasOwnProperty('matchesAny') ? overrides.matchesAny! : [609],
        notEquals: overrides && overrides.hasOwnProperty('notEquals') ? overrides.notEquals! : 7529,
    };
};

export const aTimeTracking_WeeklyApprovalReminder = (overrides?: Partial<TimeTracking_WeeklyApprovalReminder>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WeeklyApprovalReminder' } & TimeTracking_WeeklyApprovalReminder => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WeeklyApprovalReminder');
    return {
        __typename: 'TimeTracking_WeeklyApprovalReminder',
        currentWeekReminder: overrides && overrides.hasOwnProperty('currentWeekReminder') ? overrides.currentWeekReminder! : relationshipsToOmit.has('TimeTracking_WeeklyApprovalReminderDetails') ? {} as TimeTracking_WeeklyApprovalReminderDetails : aTimeTracking_WeeklyApprovalReminderDetails({}, relationshipsToOmit),
        previousWeekReminder: overrides && overrides.hasOwnProperty('previousWeekReminder') ? overrides.previousWeekReminder! : relationshipsToOmit.has('TimeTracking_WeeklyApprovalReminderDetails') ? {} as TimeTracking_WeeklyApprovalReminderDetails : aTimeTracking_WeeklyApprovalReminderDetails({}, relationshipsToOmit),
    };
};

export const aTimeTracking_WeeklyApprovalReminderDetails = (overrides?: Partial<TimeTracking_WeeklyApprovalReminderDetails>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WeeklyApprovalReminderDetails' } & TimeTracking_WeeklyApprovalReminderDetails => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WeeklyApprovalReminderDetails');
    return {
        __typename: 'TimeTracking_WeeklyApprovalReminderDetails',
        daysOfWeek: overrides && overrides.hasOwnProperty('daysOfWeek') ? overrides.daysOfWeek! : relationshipsToOmit.has('TimeTracking_ApprovalReminderDaysOfWeek') ? {} as TimeTracking_ApprovalReminderDaysOfWeek : aTimeTracking_ApprovalReminderDaysOfWeek({}, relationshipsToOmit),
        hour: overrides && overrides.hasOwnProperty('hour') ? overrides.hour! : relationshipsToOmit.has('TimeTracking_SettingInteger') ? {} as TimeTracking_SettingInteger : aTimeTracking_SettingInteger({}, relationshipsToOmit),
        reminderMedium: overrides && overrides.hasOwnProperty('reminderMedium') ? overrides.reminderMedium! : relationshipsToOmit.has('TimeTracking_SettingNotificationMedium') ? {} as TimeTracking_SettingNotificationMedium : aTimeTracking_SettingNotificationMedium({}, relationshipsToOmit),
    };
};

export const aTimeTracking_WeeklyApprovalReminderDetailsInput = (overrides?: Partial<TimeTracking_WeeklyApprovalReminderDetailsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_WeeklyApprovalReminderDetailsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WeeklyApprovalReminderDetailsInput');
    return {
        daysOfWeek: overrides && overrides.hasOwnProperty('daysOfWeek') ? overrides.daysOfWeek! : relationshipsToOmit.has('TimeTracking_ApprovalReminderDaysOfWeekInput') ? {} as TimeTracking_ApprovalReminderDaysOfWeekInput : aTimeTracking_ApprovalReminderDaysOfWeekInput({}, relationshipsToOmit),
        hour: overrides && overrides.hasOwnProperty('hour') ? overrides.hour! : relationshipsToOmit.has('TimeTracking_UpdateSettingIntegerInput') ? {} as TimeTracking_UpdateSettingIntegerInput : aTimeTracking_UpdateSettingIntegerInput({}, relationshipsToOmit),
        reminderMedium: overrides && overrides.hasOwnProperty('reminderMedium') ? overrides.reminderMedium! : relationshipsToOmit.has('TimeTracking_UpdateSettingApprovalReminderMediumInput') ? {} as TimeTracking_UpdateSettingApprovalReminderMediumInput : aTimeTracking_UpdateSettingApprovalReminderMediumInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_WeeklyApprovalReminderInput = (overrides?: Partial<TimeTracking_WeeklyApprovalReminderInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_WeeklyApprovalReminderInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WeeklyApprovalReminderInput');
    return {
        currentWeekReminder: overrides && overrides.hasOwnProperty('currentWeekReminder') ? overrides.currentWeekReminder! : relationshipsToOmit.has('TimeTracking_WeeklyApprovalReminderDetailsInput') ? {} as TimeTracking_WeeklyApprovalReminderDetailsInput : aTimeTracking_WeeklyApprovalReminderDetailsInput({}, relationshipsToOmit),
        previousWeekReminder: overrides && overrides.hasOwnProperty('previousWeekReminder') ? overrides.previousWeekReminder! : relationshipsToOmit.has('TimeTracking_WeeklyApprovalReminderDetailsInput') ? {} as TimeTracking_WeeklyApprovalReminderDetailsInput : aTimeTracking_WeeklyApprovalReminderDetailsInput({}, relationshipsToOmit),
    };
};

export const aTimeTracking_WhoIsWorkingConnection = (overrides?: Partial<TimeTracking_WhoIsWorkingConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WhoIsWorkingConnection' } & TimeTracking_WhoIsWorkingConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WhoIsWorkingConnection');
    return {
        __typename: 'TimeTracking_WhoIsWorkingConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_WhoIsWorkingEdge') ? {} as TimeTracking_WhoIsWorkingEdge : aTimeTracking_WhoIsWorkingEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
        summary: overrides && overrides.hasOwnProperty('summary') ? overrides.summary! : relationshipsToOmit.has('TimeTracking_WhoIsWorkingSummary') ? {} as TimeTracking_WhoIsWorkingSummary : aTimeTracking_WhoIsWorkingSummary({}, relationshipsToOmit),
    };
};

export const aTimeTracking_WhoIsWorkingEdge = (overrides?: Partial<TimeTracking_WhoIsWorkingEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WhoIsWorkingEdge' } & TimeTracking_WhoIsWorkingEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WhoIsWorkingEdge');
    return {
        __typename: 'TimeTracking_WhoIsWorkingEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'minima',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_WhoIsWorkingWorker') ? {} as TimeTracking_WhoIsWorkingWorker : aTimeTracking_WhoIsWorkingWorker({}, relationshipsToOmit),
    };
};

export const aTimeTracking_WhoIsWorkingFilter = (overrides?: Partial<TimeTracking_WhoIsWorkingFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_WhoIsWorkingFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WhoIsWorkingFilter');
    return {
        clockedInTimeForOnly: overrides && overrides.hasOwnProperty('clockedInTimeForOnly') ? overrides.clockedInTimeForOnly! : true,
        dateRange: overrides && overrides.hasOwnProperty('dateRange') ? overrides.dateRange! : relationshipsToOmit.has('TimeTracking_DatePeriod') ? {} as TimeTracking_DatePeriod : aTimeTracking_DatePeriod({}, relationshipsToOmit),
        searchText: overrides && overrides.hasOwnProperty('searchText') ? overrides.searchText! : 'culpa',
    };
};

export const aTimeTracking_WhoIsWorkingOrderBy = (overrides?: Partial<TimeTracking_WhoIsWorkingOrderBy>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_WhoIsWorkingOrderBy => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WhoIsWorkingOrderBy');
    return {
        orderDirection: overrides && overrides.hasOwnProperty('orderDirection') ? overrides.orderDirection! : Common_SortOrder.Asc,
        orderOn: overrides && overrides.hasOwnProperty('orderOn') ? overrides.orderOn! : TimeTracking_WhoIsWorkingOrderOn.ClockInTime,
    };
};

export const aTimeTracking_WhoIsWorkingSummary = (overrides?: Partial<TimeTracking_WhoIsWorkingSummary>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WhoIsWorkingSummary' } & TimeTracking_WhoIsWorkingSummary => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WhoIsWorkingSummary');
    return {
        __typename: 'TimeTracking_WhoIsWorkingSummary',
        totalOnClock: overrides && overrides.hasOwnProperty('totalOnClock') ? overrides.totalOnClock! : 3938,
        totalWorkers: overrides && overrides.hasOwnProperty('totalWorkers') ? overrides.totalWorkers! : 9882,
    };
};

export const aTimeTracking_WhoIsWorkingWorker = (overrides?: Partial<TimeTracking_WhoIsWorkingWorker>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WhoIsWorkingWorker' } & TimeTracking_WhoIsWorkingWorker => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WhoIsWorkingWorker');
    return {
        __typename: 'TimeTracking_WhoIsWorkingWorker',
        activeTimeEntry: overrides && overrides.hasOwnProperty('activeTimeEntry') ? overrides.activeTimeEntry! : relationshipsToOmit.has('TimeTracking_TimeEntry') ? {} as TimeTracking_TimeEntry : aTimeTracking_TimeEntry({}, relationshipsToOmit),
        currentLocation: overrides && overrides.hasOwnProperty('currentLocation') ? overrides.currentLocation! : relationshipsToOmit.has('TimeTracking_LocationPoint') ? {} as TimeTracking_LocationPoint : aTimeTracking_LocationPoint({}, relationshipsToOmit),
        displayName: overrides && overrides.hasOwnProperty('displayName') ? overrides.displayName! : 'aspernatur',
        firstName: overrides && overrides.hasOwnProperty('firstName') ? overrides.firstName! : 'voluptatem',
        group: overrides && overrides.hasOwnProperty('group') ? overrides.group! : relationshipsToOmit.has('TimeTracking_GroupProfile') ? {} as TimeTracking_GroupProfile : aTimeTracking_GroupProfile({}, relationshipsToOmit),
        lastName: overrides && overrides.hasOwnProperty('lastName') ? overrides.lastName! : 'voluptatum',
        timeForContactDAS: overrides && overrides.hasOwnProperty('timeForContactDAS') ? overrides.timeForContactDAS! : relationshipsToOmit.has('DataAccess_Contact') ? {} as DataAccess_Contact : aDataAccess_Contact({}, relationshipsToOmit),
        timeForType: overrides && overrides.hasOwnProperty('timeForType') ? overrides.timeForType! : TimeTracking_TimeForType.Employee,
        totalDaySeconds: overrides && overrides.hasOwnProperty('totalDaySeconds') ? overrides.totalDaySeconds! : 1292,
    };
};

export const aTimeTracking_Worker = (overrides?: Partial<TimeTracking_Worker>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_Worker' } & TimeTracking_Worker => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_Worker');
    return {
        __typename: 'TimeTracking_Worker',
        displayName: overrides && overrides.hasOwnProperty('displayName') ? overrides.displayName! : 'nam',
        firstName: overrides && overrides.hasOwnProperty('firstName') ? overrides.firstName! : 'nemo',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '7c56cc8e-fac9-4a94-a49c-0d812b1882d9',
        identityAuthId: overrides && overrides.hasOwnProperty('identityAuthId') ? overrides.identityAuthId! : 'dd9854c9-75d9-433d-a1c0-247a16c1bfa2',
        intuitProfileId: overrides && overrides.hasOwnProperty('intuitProfileId') ? overrides.intuitProfileId! : '3786c9d1-c10b-4986-ba20-3e2f49dd3a40',
        isActive: overrides && overrides.hasOwnProperty('isActive') ? overrides.isActive! : true,
        isTimeTrackingEnabled: overrides && overrides.hasOwnProperty('isTimeTrackingEnabled') ? overrides.isTimeTrackingEnabled! : false,
        lastName: overrides && overrides.hasOwnProperty('lastName') ? overrides.lastName! : 'architecto',
        managesGroups: overrides && overrides.hasOwnProperty('managesGroups') ? overrides.managesGroups! : [relationshipsToOmit.has('TimeTracking_Group') ? {} as TimeTracking_Group : aTimeTracking_Group({}, relationshipsToOmit)],
        memberOfGroup: overrides && overrides.hasOwnProperty('memberOfGroup') ? overrides.memberOfGroup! : relationshipsToOmit.has('TimeTracking_Group') ? {} as TimeTracking_Group : aTimeTracking_Group({}, relationshipsToOmit),
        timeTrackingNotificationEmail: overrides && overrides.hasOwnProperty('timeTrackingNotificationEmail') ? overrides.timeTrackingNotificationEmail! : 'enim',
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : TimeTracking_TimeForType.Employee,
    };
};

export const aTimeTracking_WorkerConnection = (overrides?: Partial<TimeTracking_WorkerConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WorkerConnection' } & TimeTracking_WorkerConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkerConnection');
    return {
        __typename: 'TimeTracking_WorkerConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_WorkerEdge') ? {} as TimeTracking_WorkerEdge : aTimeTracking_WorkerEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
        totalCount: overrides && overrides.hasOwnProperty('totalCount') ? overrides.totalCount! : 5952,
    };
};

export const aTimeTracking_WorkerEdge = (overrides?: Partial<TimeTracking_WorkerEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WorkerEdge' } & TimeTracking_WorkerEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkerEdge');
    return {
        __typename: 'TimeTracking_WorkerEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'sed',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_Worker') ? {} as TimeTracking_Worker : aTimeTracking_Worker({}, relationshipsToOmit),
    };
};

export const aTimeTracking_WorkerPermissions = (overrides?: Partial<TimeTracking_WorkerPermissions>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WorkerPermissions' } & TimeTracking_WorkerPermissions => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkerPermissions');
    return {
        __typename: 'TimeTracking_WorkerPermissions',
        admin: overrides && overrides.hasOwnProperty('admin') ? overrides.admin! : true,
        featurePermissions: overrides && overrides.hasOwnProperty('featurePermissions') ? overrides.featurePermissions! : relationshipsToOmit.has('TimeTracking_FeaturePermissions') ? {} as TimeTracking_FeaturePermissions : aTimeTracking_FeaturePermissions({}, relationshipsToOmit),
        managementPermissions: overrides && overrides.hasOwnProperty('managementPermissions') ? overrides.managementPermissions! : relationshipsToOmit.has('TimeTracking_ManagementPermissions') ? {} as TimeTracking_ManagementPermissions : aTimeTracking_ManagementPermissions({}, relationshipsToOmit),
        projectPermission: overrides && overrides.hasOwnProperty('projectPermission') ? overrides.projectPermission! : TimeTracking_ProjectPermission.Manage,
        schedulePermissions: overrides && overrides.hasOwnProperty('schedulePermissions') ? overrides.schedulePermissions! : relationshipsToOmit.has('TimeTracking_SchedulePermissions') ? {} as TimeTracking_SchedulePermissions : aTimeTracking_SchedulePermissions({}, relationshipsToOmit),
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : '7aaeeb97-ca7d-4de3-86d5-4944529e1936',
        workerType: overrides && overrides.hasOwnProperty('workerType') ? overrides.workerType! : TimeTracking_TimeForType.Employee,
    };
};

export const aTimeTracking_WorkerPermissionsInput = (overrides?: Partial<TimeTracking_WorkerPermissionsInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_WorkerPermissionsInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkerPermissionsInput');
    return {
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : 'a2a7de85-75af-4f50-90f6-efe3ec3d4f1a',
        workerType: overrides && overrides.hasOwnProperty('workerType') ? overrides.workerType! : TimeTracking_TimeForType.Employee,
    };
};

export const aTimeTracking_WorkerQueryFilter = (overrides?: Partial<TimeTracking_WorkerQueryFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_WorkerQueryFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkerQueryFilter');
    return {
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : 'ad818ca6-6dcc-44bb-9246-4e1d86817493',
        type: overrides && overrides.hasOwnProperty('type') ? overrides.type! : TimeTracking_TimeForType.Employee,
    };
};

export const aTimeTracking_WorkerSubmitTimeDates = (overrides?: Partial<TimeTracking_WorkerSubmitTimeDates>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WorkerSubmitTimeDates' } & TimeTracking_WorkerSubmitTimeDates => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkerSubmitTimeDates');
    return {
        __typename: 'TimeTracking_WorkerSubmitTimeDates',
        approvedTo: overrides && overrides.hasOwnProperty('approvedTo') ? overrides.approvedTo! : 'voluptas',
        submittedTo: overrides && overrides.hasOwnProperty('submittedTo') ? overrides.submittedTo! : 'omnis',
        workerId: overrides && overrides.hasOwnProperty('workerId') ? overrides.workerId! : 'f2c76b72-051d-4c0e-b02d-c06ad3fea067',
        workerType: overrides && overrides.hasOwnProperty('workerType') ? overrides.workerType! : TimeTracking_TimeForType.Employee,
    };
};

export const aTimeTracking_WorkerTimeSummary = (overrides?: Partial<TimeTracking_WorkerTimeSummary>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WorkerTimeSummary' } & TimeTracking_WorkerTimeSummary => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkerTimeSummary');
    return {
        __typename: 'TimeTracking_WorkerTimeSummary',
        timeFor: overrides && overrides.hasOwnProperty('timeFor') ? overrides.timeFor! : relationshipsToOmit.has('Commerce_Vendor') ? {} as Commerce_Vendor : aCommerce_Vendor({}, relationshipsToOmit),
        timeForContactDAS: overrides && overrides.hasOwnProperty('timeForContactDAS') ? overrides.timeForContactDAS! : relationshipsToOmit.has('DataAccess_Contact') ? {} as DataAccess_Contact : aDataAccess_Contact({}, relationshipsToOmit),
        timeForType: overrides && overrides.hasOwnProperty('timeForType') ? overrides.timeForType! : TimeTracking_TimeForType.Employee,
        totalBillableSeconds: overrides && overrides.hasOwnProperty('totalBillableSeconds') ? overrides.totalBillableSeconds! : 'sequi',
        totalRegularSeconds: overrides && overrides.hasOwnProperty('totalRegularSeconds') ? overrides.totalRegularSeconds! : 'quis',
        totalWorkSeconds: overrides && overrides.hasOwnProperty('totalWorkSeconds') ? overrides.totalWorkSeconds! : 'culpa',
    };
};

export const aTimeTracking_WorkerTimeSummaryConnection = (overrides?: Partial<TimeTracking_WorkerTimeSummaryConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WorkerTimeSummaryConnection' } & TimeTracking_WorkerTimeSummaryConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkerTimeSummaryConnection');
    return {
        __typename: 'TimeTracking_WorkerTimeSummaryConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_WorkerTimeSummaryEdge') ? {} as TimeTracking_WorkerTimeSummaryEdge : aTimeTracking_WorkerTimeSummaryEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_WorkerTimeSummaryEdge = (overrides?: Partial<TimeTracking_WorkerTimeSummaryEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WorkerTimeSummaryEdge' } & TimeTracking_WorkerTimeSummaryEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkerTimeSummaryEdge');
    return {
        __typename: 'TimeTracking_WorkerTimeSummaryEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'sint',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_WorkerTimeSummary') ? {} as TimeTracking_WorkerTimeSummary : aTimeTracking_WorkerTimeSummary({}, relationshipsToOmit),
    };
};

export const aTimeTracking_WorkerTimeSummaryFilter = (overrides?: Partial<TimeTracking_WorkerTimeSummaryFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_WorkerTimeSummaryFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkerTimeSummaryFilter');
    return {
        customerId: overrides && overrides.hasOwnProperty('customerId') ? overrides.customerId! : '31e23319-7ac2-413f-800b-11d7d15ac784',
        dateRange: overrides && overrides.hasOwnProperty('dateRange') ? overrides.dateRange! : relationshipsToOmit.has('TimeTracking_DatePeriod') ? {} as TimeTracking_DatePeriod : aTimeTracking_DatePeriod({}, relationshipsToOmit),
        projectId: overrides && overrides.hasOwnProperty('projectId') ? overrides.projectId! : '08814246-c0b9-4190-af71-51f77e2085ff',
        serviceItemId: overrides && overrides.hasOwnProperty('serviceItemId') ? overrides.serviceItemId! : '7562841d-5d73-4491-83d9-c016231b334f',
        workerIds: overrides && overrides.hasOwnProperty('workerIds') ? overrides.workerIds! : ['e800e685-cfed-48a2-81d6-37b722d0d9f9'],
    };
};

export const aTimeTracking_WorkerTimeSummaryInput = (overrides?: Partial<TimeTracking_WorkerTimeSummaryInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_WorkerTimeSummaryInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkerTimeSummaryInput');
    return {
        orderBy: overrides && overrides.hasOwnProperty('orderBy') ? overrides.orderBy! : [TimeTracking_WorkerTimeSummaryOrderBy.TotalWorkSecondsAsc],
        workerTimeSummaryFilter: overrides && overrides.hasOwnProperty('workerTimeSummaryFilter') ? overrides.workerTimeSummaryFilter! : relationshipsToOmit.has('TimeTracking_WorkerTimeSummaryFilter') ? {} as TimeTracking_WorkerTimeSummaryFilter : aTimeTracking_WorkerTimeSummaryFilter({}, relationshipsToOmit),
    };
};

export const aTimeTracking_WorkersQueryFilter = (overrides?: Partial<TimeTracking_WorkersQueryFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_WorkersQueryFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkersQueryFilter');
    return {
        groupId: overrides && overrides.hasOwnProperty('groupId') ? overrides.groupId! : '2429e552-2851-4c13-80e8-6d97d2ea2cbe',
        hasGroup: overrides && overrides.hasOwnProperty('hasGroup') ? overrides.hasGroup! : false,
        identityAuthIds: overrides && overrides.hasOwnProperty('identityAuthIds') ? overrides.identityAuthIds! : ['7062c950-c17b-4e00-8db4-1fb565ab2e4d'],
        isActive: overrides && overrides.hasOwnProperty('isActive') ? overrides.isActive! : true,
        isTimeTrackingEnabled: overrides && overrides.hasOwnProperty('isTimeTrackingEnabled') ? overrides.isTimeTrackingEnabled! : true,
        managesGroupId: overrides && overrides.hasOwnProperty('managesGroupId') ? overrides.managesGroupId! : '7ec4e465-41ba-4a21-ba0f-867ad099b606',
        searchText: overrides && overrides.hasOwnProperty('searchText') ? overrides.searchText! : 'autem',
        types: overrides && overrides.hasOwnProperty('types') ? overrides.types! : [TimeTracking_TimeForType.Employee],
        workerFilters: overrides && overrides.hasOwnProperty('workerFilters') ? overrides.workerFilters! : [relationshipsToOmit.has('TimeTracking_WorkerQueryFilter') ? {} as TimeTracking_WorkerQueryFilter : aTimeTracking_WorkerQueryFilter({}, relationshipsToOmit)],
    };
};

export const aTimeTracking_WorkersWithTimeEntries = (overrides?: Partial<TimeTracking_WorkersWithTimeEntries>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WorkersWithTimeEntries' } & TimeTracking_WorkersWithTimeEntries => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkersWithTimeEntries');
    return {
        __typename: 'TimeTracking_WorkersWithTimeEntries',
        timeFor: overrides && overrides.hasOwnProperty('timeFor') ? overrides.timeFor! : relationshipsToOmit.has('Commerce_Vendor') ? {} as Commerce_Vendor : aCommerce_Vendor({}, relationshipsToOmit),
        timeForContactDAS: overrides && overrides.hasOwnProperty('timeForContactDAS') ? overrides.timeForContactDAS! : relationshipsToOmit.has('DataAccess_Contact') ? {} as DataAccess_Contact : aDataAccess_Contact({}, relationshipsToOmit),
        timeForType: overrides && overrides.hasOwnProperty('timeForType') ? overrides.timeForType! : TimeTracking_TimeForType.Employee,
    };
};

export const aTimeTracking_WorkersWithTimeEntriesConnection = (overrides?: Partial<TimeTracking_WorkersWithTimeEntriesConnection>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WorkersWithTimeEntriesConnection' } & TimeTracking_WorkersWithTimeEntriesConnection => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkersWithTimeEntriesConnection');
    return {
        __typename: 'TimeTracking_WorkersWithTimeEntriesConnection',
        edges: overrides && overrides.hasOwnProperty('edges') ? overrides.edges! : [relationshipsToOmit.has('TimeTracking_WorkersWithTimeEntriesEdge') ? {} as TimeTracking_WorkersWithTimeEntriesEdge : aTimeTracking_WorkersWithTimeEntriesEdge({}, relationshipsToOmit)],
        pageInfo: overrides && overrides.hasOwnProperty('pageInfo') ? overrides.pageInfo! : relationshipsToOmit.has('Common_PageInfo') ? {} as Common_PageInfo : aCommon_PageInfo({}, relationshipsToOmit),
    };
};

export const aTimeTracking_WorkersWithTimeEntriesEdge = (overrides?: Partial<TimeTracking_WorkersWithTimeEntriesEdge>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'TimeTracking_WorkersWithTimeEntriesEdge' } & TimeTracking_WorkersWithTimeEntriesEdge => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkersWithTimeEntriesEdge');
    return {
        __typename: 'TimeTracking_WorkersWithTimeEntriesEdge',
        cursor: overrides && overrides.hasOwnProperty('cursor') ? overrides.cursor! : 'harum',
        node: overrides && overrides.hasOwnProperty('node') ? overrides.node! : relationshipsToOmit.has('TimeTracking_WorkersWithTimeEntries') ? {} as TimeTracking_WorkersWithTimeEntries : aTimeTracking_WorkersWithTimeEntries({}, relationshipsToOmit),
    };
};

export const aTimeTracking_WorkersWithTimeEntriesFilter = (overrides?: Partial<TimeTracking_WorkersWithTimeEntriesFilter>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_WorkersWithTimeEntriesFilter => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkersWithTimeEntriesFilter');
    return {
        dateRange: overrides && overrides.hasOwnProperty('dateRange') ? overrides.dateRange! : relationshipsToOmit.has('TimeTracking_DatePeriod') ? {} as TimeTracking_DatePeriod : aTimeTracking_DatePeriod({}, relationshipsToOmit),
    };
};

export const aTimeTracking_WorkersWithTimeEntriesInput = (overrides?: Partial<TimeTracking_WorkersWithTimeEntriesInput>, _relationshipsToOmit: Set<string> = new Set()): TimeTracking_WorkersWithTimeEntriesInput => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('TimeTracking_WorkersWithTimeEntriesInput');
    return {
        workersFilter: overrides && overrides.hasOwnProperty('workersFilter') ? overrides.workersFilter! : relationshipsToOmit.has('TimeTracking_WorkersWithTimeEntriesFilter') ? {} as TimeTracking_WorkersWithTimeEntriesFilter : aTimeTracking_WorkersWithTimeEntriesFilter({}, relationshipsToOmit),
    };
};

export const aWorkerManagement_Employee = (overrides?: Partial<WorkerManagement_Employee>, _relationshipsToOmit: Set<string> = new Set()): { __typename: 'WorkerManagement_Employee' } & WorkerManagement_Employee => {
    const relationshipsToOmit: Set<string> = new Set(_relationshipsToOmit);
    relationshipsToOmit.add('WorkerManagement_Employee');
    return {
        __typename: 'WorkerManagement_Employee',
        id: overrides && overrides.hasOwnProperty('id') ? overrides.id! : '80c17a98-73cf-4c92-acb2-ee292979284c',
    };
};
