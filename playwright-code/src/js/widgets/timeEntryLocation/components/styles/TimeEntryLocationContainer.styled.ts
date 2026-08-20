import styled from 'styled-components';
import Trowser from '@ids-ts/trowser';
import { smallScreen } from './common.styles';

// Design tokens
const BORDER_COLOR = '#d4d7dc';
const BORDER_RADIUS = '12px';
const SECTION_PADDING = '16px';
const CONTENT_GAP = '24px';
const HEADER_GAP = '12px';

// Styled Trowser wrapper
export const StyledTrowser = styled(Trowser)`
  [class^='Trowser-sectionContent-'] {
    height: 100%;
  }
`;

// Page wrapper
export const PageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${CONTENT_GAP};
  width: 80%;
  margin: auto;
  height: 100%;
  padding-top: 16px;

  ${smallScreen(`
    width: 90%;
    height: auto;
    min-height: 0;
  `)}
`;

// Header section
export const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${HEADER_GAP};
`;

// Content wrapper with flex wrap
export const ContentWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex: 1;
  border: 1px solid ${BORDER_COLOR};
  border-radius: ${BORDER_RADIUS};
  overflow: hidden;
  margin-bottom: 12px;

  ${smallScreen(`
    overflow: visible;
  `)}
`;

// Map section - wraps to full width on small screens
export const MapSection = styled.div`
  flex: 1;
  min-width: 50%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid ${BORDER_COLOR};
  overflow: hidden;

  ${smallScreen(`
    min-width: 100%;
    height: 40vh;
    min-height: 300px;
    flex: 0 0 auto;
    border-right: none;
    border-bottom: 1px solid ${BORDER_COLOR};
  `)}
`;

// Details section - wraps to full width on small screens
export const DetailsSection = styled.div`
  flex: 1;
  padding: ${SECTION_PADDING};
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;

  /* Enable overall scroll only on small screens */
  ${smallScreen(`
    min-width: 100%;
    flex: none;
    height: auto;
    max-height: calc(100vh - 40vh);
    overflow-y: auto;
    overflow-x: hidden;
  `)}
`;

// Loading container
export const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
`;
