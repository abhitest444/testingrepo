import React, { useMemo, useState } from 'react';
import { useIntl, useTracking } from '@payroll/quicksand';
import { ExpandAll, CommentPencil } from '@design-systems/icons';
import { B2, B3 } from '@ids-ts/typography';
import Chip from '@ids-ts/chip';
import {
  TimeTracking_TimeEntry,
  TimeTracking_TimeEntryDeviceAttributes,
} from 'src/__generated__/timeTracking/graphql';
import {
  GreenLocationMarker,
  GrayLocationMarker,
  OrangeLocationMarker,
} from '../styles/common.styles';
import { DEVICE_FLAG_LABEL_NLS_ID, LocationPointData } from '../types';
import {
  DEVICE_NOTE_TRUNCATE_LENGTH,
  getActiveDeviceFlagKeys,
  getClockInOutTimes,
  getFirstDeviceNote,
  hasActiveDeviceFlags,
  mapLocationPointsToTimeline,
  truncateDeviceNote,
} from '../../utils/locationPointUtils';
import { LOCATION_MAP_TRACKING_POINTS } from '../../utils/locationMapTrackingPoints';
import {
  TimelineWrapper,
  TimelineRow,
  TimelineRowContent,
  TimelineRowHeader,
  TimelineDotSeparator,
  DotColumn,
  MarkerWrapper,
  VerticalDotsWrapper,
  SmallDot,
  ExpandIconWrapper,
  ExpandButton,
  ExpandLabelWrapper,
  NoteBlockWrapper,
  NoteIconWrapper,
  NoteTextWrapper,
  NoteText,
  ShowMoreButton,
} from '../styles/TimeEntryTimeline.styled';

interface TimeEntryTimelineProps {
  timeEntry: TimeTracking_TimeEntry | null;
  locationPoints: LocationPointData[];
  /** Whether the SBSEG-QBO-geofence-flags feature flag is enabled */
  isGeofenceFlagsEnabled?: boolean;
}

// Renders a point's time, its active flag chip(s), and the first note (if any), with show more/less
const TimelineRowFlags: React.FC<{
  deviceAttributes?: TimeTracking_TimeEntryDeviceAttributes | null;
  time: string;
  isGeofenceFlagsEnabled?: boolean;
}> = ({ deviceAttributes, time, isGeofenceFlagsEnabled }) => {
  const intl = useIntl();
  const text = (id: string) => intl.formatMessage({ id });
  const [isNoteExpanded, setIsNoteExpanded] = useState(false);

  const flagKeys = isGeofenceFlagsEnabled
    ? getActiveDeviceFlagKeys(deviceAttributes)
    : [];
  const firstNote = isGeofenceFlagsEnabled
    ? getFirstDeviceNote(deviceAttributes)
    : null;
  const isNoteTruncatable =
    !!firstNote && firstNote.length > DEVICE_NOTE_TRUNCATE_LENGTH;

  return (
    <TimelineRowContent>
      <TimelineRowHeader>
        <B2 weight="medium">{time}</B2>
        {flagKeys.length > 0 && (
          <TimelineDotSeparator>&bull;</TimelineDotSeparator>
        )}
        {flagKeys.map((key) => (
          <Chip
            key={key}
            selectionLabels={[text(DEVICE_FLAG_LABEL_NLS_ID[key])]}
            dismissible={false}
          />
        ))}
      </TimelineRowHeader>

      {firstNote && (
        <NoteBlockWrapper>
          <NoteIconWrapper>
            <CommentPencil size="small" />
          </NoteIconWrapper>
          <NoteTextWrapper>
            <NoteText>
              <B3>
                {isNoteExpanded ? firstNote : truncateDeviceNote(firstNote)}
              </B3>
            </NoteText>
            {isNoteTruncatable && (
              <ShowMoreButton
                onClick={() => setIsNoteExpanded(!isNoteExpanded)}
              >
                <B3 weight="medium">
                  {isNoteExpanded
                    ? text('timeEntryLocation.timeline.showLess')
                    : text('timeEntryLocation.timeline.showMore')}
                </B3>
              </ShowMoreButton>
            )}
          </NoteTextWrapper>
        </NoteBlockWrapper>
      )}
    </TimelineRowContent>
  );
};

// Vertical connector dots - stretches (via VerticalDotsWrapper's flex: 1) to fill
// whatever height DotColumn has below the marker, so it reaches the next point's
// marker regardless of how tall this point's note block is
const VerticalDots: React.FC = () => (
  <VerticalDotsWrapper>
    <SmallDot />
    <SmallDot />
    <SmallDot />
  </VerticalDotsWrapper>
);

const TimeEntryTimeline: React.FC<TimeEntryTimelineProps> = ({
  timeEntry,
  locationPoints,
  isGeofenceFlagsEnabled,
}) => {
  const intl = useIntl();
  const track = useTracking();
  const [isExpanded, setIsExpanded] = useState(false);

  const text = (id: string, values?: Record<string, string>) =>
    intl.formatMessage({ id }, values);

  const handleToggleExpand = () => {
    // Track the expand all location points button when clicked
    // if isExpanded is false,it means the timeline is collapsed and user clicked the button to expand the timeline
    if (!isExpanded) {
      track(LOCATION_MAP_TRACKING_POINTS.EXPAND_ALL_LOCATION_POINTS);
    }
    setIsExpanded(!isExpanded);
  };

  // Extract clock in/out times from first and last location points
  const { clockInTime, clockOutTime } = useMemo(
    () => getClockInOutTimes(locationPoints),
    [locationPoints],
  );

  // Check if there are additional location points beyond the start and end location points
  const hasIntermediateLocationPoints = locationPoints.length > 2;
  // Check if there is more than 1 location point (to show clock out)
  const hasMultipleLocationPoints = locationPoints.length > 1;

  // Clock-in/clock-out points carry their own flags/notes; the dot turns orange when flagged, same as intermediate points
  const clockInPoint = locationPoints[0];
  const clockOutPoint = locationPoints[locationPoints.length - 1];
  const clockInHasFlags = hasActiveDeviceFlags(
    clockInPoint?.deviceAttributes,
    isGeofenceFlagsEnabled,
  );
  const clockOutHasFlags = hasActiveDeviceFlags(
    clockOutPoint?.deviceAttributes,
    isGeofenceFlagsEnabled,
  );

  // Filter out first and last location points (they match clock in/out), then transform to timeline format
  const timelineLocationPoints = useMemo(() => {
    // Remove first and last location points as they match clock in/out times
    let filteredPoints = locationPoints;
    if (locationPoints.length > 2) {
      filteredPoints = locationPoints.slice(1, -1);
    } else {
      // If 2 or fewer points, show none (just clock in -> dots -> clock out)
      filteredPoints = [];
    }
    return mapLocationPointsToTimeline(filteredPoints);
  }, [locationPoints]);

  // Return null if there are no location points
  if (!locationPoints || locationPoints.length === 0) {
    return null;
  }

  return (
    <TimelineWrapper>
      {/* Clock In - connector dots to the next row live in the same row, below the marker */}
      {clockInTime && (
        <TimelineRow>
          <DotColumn>
            <MarkerWrapper>
              {clockInHasFlags ? (
                <OrangeLocationMarker />
              ) : (
                <GreenLocationMarker />
              )}
            </MarkerWrapper>
            {hasMultipleLocationPoints && <VerticalDots />}
          </DotColumn>
          <TimelineRowFlags
            deviceAttributes={clockInPoint?.deviceAttributes}
            time={clockInTime}
            isGeofenceFlagsEnabled={isGeofenceFlagsEnabled}
          />
        </TimelineRow>
      )}

      {/* Expand/Collapse button, location points, and vertical dots before clock out - only show if more than 2 points */}
      {hasIntermediateLocationPoints && (
        <>
          {!isExpanded ? (
            // Same layout as a timeline point row: icon on the axis with the
            // label beside it, then connector dots into Clock Out. Clock In
            // already supplies the dots above this row.
            <ExpandButton onClick={handleToggleExpand}>
              <DotColumn>
                <ExpandIconWrapper>
                  <ExpandAll />
                </ExpandIconWrapper>
                <VerticalDots />
              </DotColumn>
              <ExpandLabelWrapper>
                <B2 weight="medium" color="#6B6C72">
                  {text('timeEntryLocation.timeline.expandAll')}
                </B2>
              </ExpandLabelWrapper>
            </ExpandButton>
          ) : (
            <>
              {/* Location Points */}
              {timelineLocationPoints.map((point) => {
                const hasFlags = hasActiveDeviceFlags(
                  point.deviceAttributes,
                  isGeofenceFlagsEnabled,
                );

                return (
                  <TimelineRow key={point.id}>
                    <DotColumn>
                      <MarkerWrapper>
                        {hasFlags ? (
                          <OrangeLocationMarker />
                        ) : (
                          <GrayLocationMarker />
                        )}
                      </MarkerWrapper>
                      <VerticalDots />
                    </DotColumn>
                    <TimelineRowFlags
                      deviceAttributes={point.deviceAttributes}
                      time={point.time}
                      isGeofenceFlagsEnabled={isGeofenceFlagsEnabled}
                    />
                  </TimelineRow>
                );
              })}
            </>
          )}
        </>
      )}

      {/* Clock Out - only show if more than 1 location point */}
      {hasMultipleLocationPoints && (
        <TimelineRow>
          <DotColumn>
            <MarkerWrapper>
              {clockOutHasFlags ? (
                <OrangeLocationMarker />
              ) : (
                <GreenLocationMarker />
              )}
            </MarkerWrapper>
          </DotColumn>
          <TimelineRowFlags
            deviceAttributes={clockOutPoint?.deviceAttributes}
            time={clockOutTime}
            isGeofenceFlagsEnabled={isGeofenceFlagsEnabled}
          />
        </TimelineRow>
      )}
    </TimelineWrapper>
  );
};

export default TimeEntryTimeline;
