import React, { useMemo } from 'react';
import TextField from '@ids-ts/text-field';
import { Dropdown, MenuItem } from '@ids-ts/dropdown';
import { ReactEvent } from '@ids-ts/dropdown-typeahead/dist/types';
import Chip from '@ids-ts/chip';
import { B3 } from '@ids-ts/typography';
import { useIntl } from '@payroll/quicksand';
import { TimeTracking_TimeEntry } from 'src/__generated__/timeTracking/graphql';
import { DEVICE_FLAG_LABEL_NLS_ID, LocationPointData } from '../types';
import {
  getTeamMemberInfo,
  getCustomerInfo,
  getTimeEntryRange,
  getTotalHoursFromLocationPoints,
  getFormattedAddress,
  getEntryLevelDeviceFlagKeys,
} from '../../utils/locationPointUtils';
import { HorizontalDivider } from '../styles/common.styles';
import {
  FiltersWrapper,
  FilterRow,
  FilterField,
  FullWidthField,
  DetailsSection,
  TimesheetFlagsWrapper,
  TimesheetFlagsChips,
} from '../styles/TimeEntryFilters.styled';

interface TimeEntryFiltersProps {
  timeEntry: TimeTracking_TimeEntry | null;
  locationPoints: LocationPointData[];
  sameDayGeoEntryTimeRangesById?: Record<string, string>;
  onSameDayTimeEntrySelect?: (timeEntryId: string) => void;
  /** Whether the SBSEG-QBO-geofence-flags feature flag is enabled */
  isGeofenceFlagsEnabled?: boolean;
}

const TimeEntryFilters: React.FC<TimeEntryFiltersProps> = ({
  timeEntry,
  locationPoints,
  sameDayGeoEntryTimeRangesById,
  onSameDayTimeEntrySelect,
  isGeofenceFlagsEnabled,
}) => {
  const intl = useIntl();
  const text = (id: string) => intl.formatMessage({ id });

  // Extract team member info from timeEntry
  const { name: teamMemberName, id: teamMemberId } =
    getTeamMemberInfo(timeEntry);

  // Extract customer/project info from timeEntry
  const { name: customerName, id: customerId } = getCustomerInfo(timeEntry);

  // Extract time range from timeEntry startTime and endTime
  const nowText = text('timeEntryLocation.now');
  const timeEntryRange = getTimeEntryRange(timeEntry, nowText);

  const sameDayGeoOptions = useMemo(
    () =>
      sameDayGeoEntryTimeRangesById
        ? Object.entries(sameDayGeoEntryTimeRangesById).map(([id, label]) => ({
            id,
            label,
          }))
        : [],
    [sameDayGeoEntryTimeRangesById],
  );
  // Only show the dropdown when there are multiple entries to choose from
  const showSameDayDropdown =
    sameDayGeoOptions.length > 1 && !!onSameDayTimeEntrySelect;
  const selectedSameDayId =
    timeEntry?.id && sameDayGeoEntryTimeRangesById?.[timeEntry.id] !== undefined
      ? timeEntry.id
      : '';

  // Calculate total hours from location points
  const totalHours = getTotalHoursFromLocationPoints(timeEntry);
  // Format address from timeEntry
  const address = getFormattedAddress(timeEntry);

  // Check if notes exist and have content
  const hasNotes = timeEntry?.notes && timeEntry.notes.trim().length > 0;

  // Distinct active device/geofence flags across all location points, behind the feature flag
  const timesheetFlagKeys = isGeofenceFlagsEnabled
    ? getEntryLevelDeviceFlagKeys(locationPoints)
    : [];

  return (
    <FiltersWrapper>
      {/* Section 1: Team member & Choose time entries */}
      <FilterRow>
        {/* Team Member Field */}
        <FilterField>
          <TextField
            label={text('timeEntryLocation.filters.teamMember')}
            value={teamMemberName || ''}
            readOnly
            size="medium"
            width="100%"
          />
        </FilterField>

        {/* Time: dropdown when multiple same-day geo entries exist, else read-only range */}
        <FilterField>
          {showSameDayDropdown ? (
            <Dropdown
              multiselect={false}
              colorScheme="light"
              width="100%"
              label={text('timeEntryLocation.filters.timeEntries')}
              placeholder={text(
                'timeEntryLocation.filters.timeEntries.selectPlaceholder',
              )}
              value={selectedSameDayId}
              onChange={(e: ReactEvent) => {
                onSameDayTimeEntrySelect!(
                  (e.target as HTMLSelectElement).value,
                );
              }}
              aria-label={text('timeEntryLocation.filters.timeEntries')}
              data-testid="time-entry-location-time-dropdown"
            >
              {sameDayGeoOptions.map(({ id, label: optionLabel }) => (
                <MenuItem key={id} value={id}>
                  {optionLabel}
                </MenuItem>
              ))}
            </Dropdown>
          ) : (
            <TextField
              label={text('timeEntryLocation.filters.timeEntries')}
              value={timeEntryRange || ''}
              readOnly
              size="medium"
              width="100%"
            />
          )}
        </FilterField>
      </FilterRow>

      <HorizontalDivider />

      {/* Section 2: Customer/Project, Total hours, Address, Notes */}
      <DetailsSection>
        {/* Row 1: Customer/Project & Total hours */}
        <FilterRow>
          <FilterField>
            <TextField
              label={text('timeEntryLocation.filters.customerProject')}
              value={customerName || ''}
              readOnly
              size="medium"
              width="100%"
            />
          </FilterField>
          <FilterField>
            <TextField
              label={text('timeEntryLocation.filters.totalHours')}
              value={totalHours || ''}
              readOnly
              size="medium"
              width="100%"
            />
          </FilterField>
        </FilterRow>

        {/* Row 2: Address (full width) - only show if address exists */}
        {address && (
          <FullWidthField>
            <TextField
              label={text('timeEntryLocation.filters.address')}
              value={address}
              readOnly
              size="medium"
              width="100%"
            />
          </FullWidthField>
        )}

        {/* Row 3: Notes Field - only show if notes exist and are not empty */}
        {hasNotes && (
          <FullWidthField>
            <TextField
              label={text('timeEntryLocation.filters.notes')}
              value={timeEntry.notes}
              readOnly
              size="medium"
              width="100%"
            />
          </FullWidthField>
        )}

        {/* Row 4: Timesheet flags - only shown behind the geofence flags feature flag */}
        {timesheetFlagKeys.length > 0 && (
          <FullWidthField>
            <TimesheetFlagsWrapper>
              <B3 color="#6B6C72">
                {text('timeEntryLocation.filters.timesheetFlags')}
              </B3>
              <TimesheetFlagsChips>
                {timesheetFlagKeys.map((key) => (
                  <Chip
                    key={key}
                    selectionLabels={[text(DEVICE_FLAG_LABEL_NLS_ID[key])]}
                    dismissible={false}
                  />
                ))}
              </TimesheetFlagsChips>
            </TimesheetFlagsWrapper>
          </FullWidthField>
        )}
      </DetailsSection>
    </FiltersWrapper>
  );
};

export default TimeEntryFilters;
