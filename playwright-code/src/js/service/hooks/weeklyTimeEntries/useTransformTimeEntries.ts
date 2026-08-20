import {
  TimeTracking_TimeEntry,
  TimeTracking_BillableStatus,
  TimeTracking_TimeForType,
  TimeTracking_BatchCreateUpdateTimeEntryInput,
  TimeTracking_BatchManageDeleteTimeEntryInput,
} from 'src/__generated__/timeTracking/graphql';
import { DataAccess_ContactType } from 'src/__generated__/oigql/graphql';
import { isStandardFieldAssigned } from 'src/js/common/assignmentFieldUtils';
import { useIXPFeatureFlag } from 'src/js/common/useIXPFeatureFlag';
import { FEATURE_FLAGS } from 'src/js/common/constants';
import { TimeForType } from 'src/js/widgets/weeklyTimeEntry/types';
import {
  isVisibleInCreate,
  mapDimensionsToPayload,
  resolveDimensionFormValue,
  type DimensionDefinition,
  type DimensionValue,
} from 'src/js/widgets/common/dimensions';
// Import Redux types
import type {
  TimesheetRow,
  TeamMember,
  timeEntryDetails,
} from 'src/js/widgets/weeklyTimeEntry/store/timeEntryGridSlice';
import type { CustomerAssignments } from 'src/js/widgets/weeklyTimeEntry/store/assignmentSlice';

// Interface for the data we need from Redux state
interface TimeEntryGridData {
  weeklyTimeEntries: TimesheetRow[];
  teamMember: TeamMember;
  dateRange: {
    start: string; // Week start date in YYYY-MM-DD format
    end: string; // Week end date in YYYY-MM-DD format
  };
}

/**
 * Context for gating billable fields in the mutation payload.
 * Mirrors the STE pattern: use assignment data when a customer is selected,
 * fall back to company settings otherwise.
 */
export interface BillableContext {
  isBillingFieldEnabled: boolean;
  customerAssignmentsMap: Record<string, CustomerAssignments>;
}

const hoursToSeconds = (hours: number): number => Math.round(hours * (60 * 60));

const resolveTimeForType = (
  teamMemberType: TimeForType,
  isLegacyQboUserEnabled: boolean,
): TimeTracking_TimeForType => {
  if (
    isLegacyQboUserEnabled &&
    teamMemberType === TimeForType.LEGACY_QBO_USER
  ) {
    return TimeTracking_TimeForType.LegacyQboUser;
  }
  return teamMemberType === TimeForType.EMPLOYEE
    ? TimeTracking_TimeForType.Employee
    : TimeTracking_TimeForType.Vendor;
};

export const useTransformTimeEntries = () => {
  const { isEnabled: isLegacyQboUserEnabled } = useIXPFeatureFlag({
    flagName: FEATURE_FLAGS.QB_TIME_TRACKING_UI_ENABLE_LEGACY_QBO_USER,
    defaultValue: false,
  });
  /**
   * Transform the actual Redux state structure to GraphQL mutation input
   * Assumes Redux state only contains data for the current selected week
   */
  const transformToTimeEntries = (
    timeEntryGridData: TimeEntryGridData,
    billableContext?: BillableContext,
    dimensionDefinitions: DimensionDefinition[] = [],
  ): TimeTracking_BatchCreateUpdateTimeEntryInput[] => {
    const timeEntries: TimeTracking_BatchCreateUpdateTimeEntryInput[] = [];
    const { weeklyTimeEntries, teamMember, dateRange } = timeEntryGridData;

    // Note: dateRange is included for context but not used for filtering
    // since Redux state should only contain the current week's data

    weeklyTimeEntries.forEach((row: TimesheetRow) => {
      // Determine if billable field is active for this row's customer.
      // Mirrors STE: customer selected → check assignment; no customer → company settings.
      const isBillableFieldActive = (() => {
        if (!billableContext) {
          return false;
        }
        const custId = row.timeAgainst?.id;
        if (!custId) {
          return billableContext.isBillingFieldEnabled;
        }
        const customerData = billableContext.customerAssignmentsMap[custId];
        if (
          !customerData ||
          customerData.standardFieldAssignments.length === 0
        ) {
          return billableContext.isBillingFieldEnabled;
        }
        return isStandardFieldAssigned(
          customerData.standardFieldAssignments,
          'billable',
        );
      })();

      // Check if this row has any effectively-billable entries (gated by assignment)
      const hasBillableEntries =
        isBillableFieldActive &&
        Object.values(row.timeEntries).some(
          (dayEntry: timeEntryDetails) =>
            dayEntry.operation === 'CREATE' || dayEntry.operation === 'UPDATE',
        ) &&
        Object.values(row.timeEntries).some(
          (dayEntry: timeEntryDetails) =>
            dayEntry.billableInfo?.billable === true,
        );

      // If there are billable entries, require time category (customer/project/break)
      if (
        hasBillableEntries &&
        (!row.timeAgainst?.id || !row.timeAgainst?.type)
      ) {
        return;
      }

      // For non-billable entries, allow saving without time category
      // Only skip if there are no valid entries to save
      const hasValidEntries = Object.values(row.timeEntries).some(
        (dayEntry: timeEntryDetails) =>
          (dayEntry.operation === 'CREATE' ||
            dayEntry.operation === 'UPDATE') &&
          dayEntry.hours !== undefined &&
          dayEntry.hours > 0,
      );

      if (!hasValidEntries) {
        return;
      }

      // Support CUSTOMER, PROJECT, BREAK, TIME_OFF, and unknown types
      const isCustomer =
        row.timeAgainst.type === DataAccess_ContactType.Customer;
      const isProject = row.timeAgainst.type === 'PROJECT';
      const isBreak =
        row.timeAgainst.type === 'PAID' || row.timeAgainst.type === 'UNPAID';
      const isTimeOff = row.timeAgainst.type === 'TIME_OFF';

      Object.values(row.timeEntries).forEach((dayEntry: timeEntryDetails) => {
        // Only include entries with CREATE or UPDATE operations
        // DELETE operations are handled separately in extractTimeEntriesToDelete
        if (
          (dayEntry.operation === 'CREATE' ||
            dayEntry.operation === 'UPDATE') &&
          dayEntry.hours &&
          dayEntry.hours > 0
        ) {
          const duration = dayEntry.hours;

          // For break type entries, only include notes and timeBreakId
          if (isBreak) {
            const timeEntry: TimeTracking_BatchCreateUpdateTimeEntryInput = {
              ...(dayEntry.timeEntryId && { id: dayEntry.timeEntryId }),
              date: dayEntry.date,
              duration: hoursToSeconds(duration),
              timeFor: {
                id: teamMember.id,
                timeForType: resolveTimeForType(
                  teamMember.type,
                  isLegacyQboUserEnabled,
                ),
              },
              timeBreakId: row.timeAgainst.id || undefined, // Use the timeAgainst.id as timeBreakId
              notes: dayEntry.notes || '',
            };
            timeEntries.push(timeEntry);
            return;
          }

          // For non-break entries, include all fields
          const timeEntry: TimeTracking_BatchCreateUpdateTimeEntryInput = {
            ...(dayEntry.timeEntryId && { id: dayEntry.timeEntryId }),
            date: dayEntry.date,
            duration: hoursToSeconds(duration),
            timeFor: {
              id: teamMember.id,
              timeForType: resolveTimeForType(
                teamMember.type,
                isLegacyQboUserEnabled,
              ),
            },
            // WTE sends customer id only (even when type is project)
            timeAgainst: (() => {
              if ((isCustomer || isProject) && row.timeAgainst.id) {
                return { customerId: row.timeAgainst.id };
              }
              // For non-billable entries without time category, return empty object
              return {};
            })(),
            ...(dayEntry.metaInfo?.class?.id && {
              classID: dayEntry.metaInfo.class.id,
            }),
            ...(dayEntry.metaInfo?.service?.id && {
              serviceItemID: dayEntry.metaInfo.service.id,
            }),
            ...(dayEntry.metaInfo?.location?.id && {
              departmentID: dayEntry.metaInfo.location.id,
            }),
            ...(dayEntry.metaInfo?.location?.name && {
              departmentLabel: dayEntry.metaInfo.location.name,
            }),
            billableStatus:
              dayEntry.billableInfo?.billable && isBillableFieldActive
                ? TimeTracking_BillableStatus.Billable
                : TimeTracking_BillableStatus.NotBillable,
            billableRate:
              dayEntry.billableInfo?.billable &&
              isBillableFieldActive &&
              dayEntry.billableInfo?.billableRate
                ? parseFloat(dayEntry.billableInfo.billableRate)
                : null,
            notes: dayEntry.notes || '',
            // Add custom fields if they exist
            ...(dayEntry.customFields &&
              dayEntry.customFields.length > 0 && {
                customFields: dayEntry.customFields.map((field) => ({
                  id: field.id,
                  name: field.name.trim(),
                  value: field.value || '',
                  optionID: field.optionID != null ? field.optionID : '', // Include optionID for dropdown fields
                })),
              }),
          };

          //   • selected option   → values: [optionId]
          //   • cleared a default → values: ['-1']
          //   • never set         → omitted from the payload
          const isCreateEntry = !dayEntry.timeEntryId;
          const dimensionValuesById = (dayEntry.dimensions || []).reduce<
            Record<string, DimensionValue>
          >((acc, dim) => {
            acc[dim.id] = {
              id: dim.id,
              optionID: dim.optionID,
              // Preserve the removed-default flag so an unchanged '-1' echoes
              // back as ['-1'] rather than degrading to [].
              ...(dim.activeValueIsDefault
                ? { activeValueIsDefault: true }
                : {}),
            };
            return acc;
          }, {});

          // On create, seed every visible definition so an untouched worker
          // default is sent (`[defaultId]`) and a prefilled default the user
          // cleared is sent as `['-1']`. A field with no populated value is
          // omitted from the payload rather than sent as `[]`.
          // Edit cells keep the response as the source of truth (echoed values).
          if (isCreateEntry) {
            dimensionDefinitions.forEach((def) => {
              if (!isVisibleInCreate(def)) return;
              const seeded = resolveDimensionFormValue(
                def,
                dimensionValuesById[def.id],
                true,
              );
              // A prefilled worker default cleared on a brand-new entry reads as
              // optionID '' — flag it so the payload sends ['-1'] (removed
              // default) instead of [] (never set).
              if (
                seeded.optionID === '' &&
                !!def.workerDefaultOptionId &&
                !seeded.activeValueIsDefault
              ) {
                seeded.activeValueIsDefault = true;
              }
              dimensionValuesById[def.id] = seeded;
            });
          }

          const customExtensions = mapDimensionsToPayload(dimensionValuesById, {
            isCreate: isCreateEntry,
          });
          if (customExtensions.dimensions.length > 0) {
            timeEntry.customExtensions = customExtensions;
          }

          timeEntries.push(timeEntry);
        }
      });
    });

    return timeEntries;
  };

  /**
   * Extract time entry IDs that should be deleted
   * Extracts entries marked with operation: 'DELETE' from the grid
   * Also extracts entries that had original values with hours > 0 but now have hours set to 0 or empty
   */
  const extractTimeEntriesToDelete = (
    timeEntryGridData: TimeEntryGridData,
  ): TimeTracking_BatchManageDeleteTimeEntryInput[] => {
    const deletionEntries: TimeTracking_BatchManageDeleteTimeEntryInput[] = [];

    timeEntryGridData.weeklyTimeEntries.forEach((row: TimesheetRow) => {
      Object.values(row.timeEntries).forEach((dayEntry: timeEntryDetails) => {
        // Check for entries marked for deletion that have valid IDs
        if (dayEntry.operation === 'DELETE' && dayEntry.timeEntryId?.trim()) {
          deletionEntries.push({ id: dayEntry.timeEntryId });
        }

        // Check for entries that had original values with hours > 0 but now have hours set to 0 or empty
        if (
          dayEntry.timeEntryId?.trim() && // Has a valid ID (was saved to backend)
          dayEntry.originalValues?.hours && // Had original hours
          dayEntry.originalValues.hours > 0 && // Original hours were > 0
          (!dayEntry.hours || dayEntry.hours === 0) && // Current hours are 0 or empty
          dayEntry.operation !== 'DELETE' // Not already marked for deletion
        ) {
          deletionEntries.push({ id: dayEntry.timeEntryId });
        }
      });
    });
    return deletionEntries;
  };

  return {
    transformToTimeEntries,
    extractTimeEntriesToDelete,
  };
};
