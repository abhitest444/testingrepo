import styled from 'styled-components';
import { Circle } from '@design-systems/icons';

// Design tokens
const TIMELINE_GAP = '12px';
const TIMELINE_MARGIN = '20px 0';
const DOT_COLUMN_WIDTH = '24px';
const DOT_SIZE = '2px';
const DOT_GAP = '4px';
const ROW_MIN_HEIGHT = '24px';
const TEXT_COLOR_SECONDARY = '#6b6c72';

// Timeline wrapper
export const TimelineWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${TIMELINE_GAP};
  margin: ${TIMELINE_MARGIN};
  width: 100%;
  flex-shrink: 0;
`;

// Timeline row - stretches children to equal height so the dot column (marker +
// connector dots) can span the row's full height, including any note block
export const TimelineRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: ${TIMELINE_GAP};
  min-height: ${ROW_MIN_HEIGHT};
`;

// Dot column for markers - the marker sits at the top (level with the time/flag
// line), and any vertical connector dots below it stretch to fill the rest of
// the row's height, including next to a note block
export const DotColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: ${DOT_COLUMN_WIDTH};
  flex-shrink: 0;
`;

// Wraps just the marker icon so it stays centered on the header row's height
export const MarkerWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${ROW_MIN_HEIGHT};
  flex-shrink: 0;
`;

// Vertical dots wrapper - fills the remaining height below the marker. min-height
// reproduces the original design's marker-to-marker connector spacing (one row
// gap + a dedicated 24px dots row) so a point with no note (e.g. feature flag
// off) renders at the same height as before - the outer TimelineWrapper gap
// after this row supplies the other half of that spacing.
export const VerticalDotsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  flex: 1;
  min-height: calc(${TIMELINE_GAP} + ${ROW_MIN_HEIGHT});
  gap: ${DOT_GAP};
  padding: ${DOT_GAP} 0;
`;

// Small dot icon
export const SmallDot = styled(Circle)`
  width: ${DOT_SIZE};
  height: ${DOT_SIZE};
  color: ${TEXT_COLOR_SECONDARY};
`;

// Expand icon wrapper - same footprint as MarkerWrapper so the expand
// chevron sits on the timeline axis under the location markers
export const ExpandIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: ${ROW_MIN_HEIGHT};
  flex-shrink: 0;
  color: ${TEXT_COLOR_SECONDARY};
`;

// Keeps the expand label on the same horizontal line as ExpandIconWrapper
export const ExpandLabelWrapper = styled.div`
  display: flex;
  align-items: center;
  min-height: ${ROW_MIN_HEIGHT};
`;

// Expand button - same flex shell as TimelineRow so ExpandAll + label sit on
// one line (icon in DotColumn, text beside it), with connector dots below
export const ExpandButton = styled.button`
  display: flex;
  align-items: flex-start;
  gap: ${TIMELINE_GAP};
  min-height: ${ROW_MIN_HEIGHT};
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  color: ${TEXT_COLOR_SECONDARY};
  text-align: left;
`;
// Wraps a timeline row's time + flag content so the note block below can span full width
export const TimelineRowContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

// Row of time text + flag chip(s), inline
export const TimelineRowHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;

// Dot separator between the time and the flag chip(s)
export const TimelineDotSeparator = styled.span`
  color: ${TEXT_COLOR_SECONDARY};
`;

// Note block shown below a flagged point (icon + truncated text + show more/less)
export const NoteBlockWrapper = styled.div`
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #f5f6f7;
  border-radius: 4px;
`;

export const NoteIconWrapper = styled.div`
  display: flex;
  align-items: flex-start;
  color: ${TEXT_COLOR_SECONDARY};
  flex-shrink: 0;
`;

export const NoteTextWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
`;

export const NoteText = styled.span`
  overflow-wrap: break-word;
  word-break: break-word;
`;

export const ShowMoreButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: left;
  color: #2ca01c;
`;
