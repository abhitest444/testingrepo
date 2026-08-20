import styled from 'styled-components';
import { B3 } from '@ids-ts/typography';
import { smallScreen } from './common.styles';

// Details wrapper - the whole panel (filters + timeline) scrolls together as one unit
export const DetailsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;

  /* On small screens, allow wrapper to grow for overall page scrolling instead */
  ${smallScreen(`
    height: auto;
    min-height: min-content;
    overflow: visible;
  `)}
`;

// Location points label
export const LocationPointsLabel = styled(B3)`
  color: #6b6c72;
  margin-top: 20px;
  flex-shrink: 0;
`;

// Timeline container - no longer scrolls independently; DetailsWrapper owns scrolling
export const TimelineScrollContainer = styled.div`
  padding-bottom: 12px;
`;
