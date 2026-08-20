import React from 'react';
import { useIntl } from '@payroll/quicksand';
import { TimeTracking_TimeEntry } from 'src/__generated__/timeTracking/graphql';
import TimeEntryFilters from './TimeEntryFilters';
import TimeEntryTimeline from './TimeEntryTimeline';
import { HorizontalDivider } from '../styles/common.styles';
import {
  DetailsWrapper,
  LocationPointsLabel,
  TimelineScrollContainer,
} from '../styles/TimeEntryDetails.styled';
import { LocationPointData } from '../types';

interface TimeEntryDetailsProps {
  /** Pre-formatted location points with timezone-adjusted timestamps */
  locationPoints: LocationPointData[];
  timeEntry: TimeTracking_TimeEntry | null;
  /** Same-day entries with geo: id → display range; drives time dropdown when present */
  sameDayGeoEntryTimeRangesById?: Record<string, string>;
  /** Switch viewed time entry and refetch location details */
  onSameDayTimeEntrySelect?: (timeEntryId: string) => void;
  /** Whether the SBSEG-QBO-geofence-flags feature flag is enabled */
  isGeofenceFlagsEnabled?: boolean;
}

// TODO: Use locationPoints and timeEntry props to format real data
const TimeEntryDetails: React.FC<TimeEntryDetailsProps> = ({
  locationPoints,
  timeEntry,
  sameDayGeoEntryTimeRangesById,
  onSameDayTimeEntrySelect,
  isGeofenceFlagsEnabled,
}) => {
  const intl = useIntl();

  return (
    <DetailsWrapper>
      {/* Section 1: Filters */}
      <TimeEntryFilters
        timeEntry={timeEntry}
        locationPoints={locationPoints}
        sameDayGeoEntryTimeRangesById={sameDayGeoEntryTimeRangesById}
        onSameDayTimeEntrySelect={onSameDayTimeEntrySelect}
        isGeofenceFlagsEnabled={isGeofenceFlagsEnabled}
      />

      {/* Divider between filters and timeline */}
      <HorizontalDivider />

      {/* Location points label */}
      <LocationPointsLabel weight="medium">
        {intl.formatMessage({
          id: 'timeEntryLocation.timeline.locationPointsLabel',
        })}
      </LocationPointsLabel>

      {/* Section 2: Timeline - Scrollable container */}
      <TimelineScrollContainer>
        <TimeEntryTimeline
          timeEntry={timeEntry}
          locationPoints={locationPoints}
          isGeofenceFlagsEnabled={isGeofenceFlagsEnabled}
        />
      </TimelineScrollContainer>
    </DetailsWrapper>
  );
};

export default TimeEntryDetails;
