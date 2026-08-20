import styled from 'styled-components';
import { H3 } from '@ids-ts/typography';
import { breakPoints } from 'src/js/common/screenSizeUtils';

/** At md breakpoint (1024px) and below: stack map on top, worker list below */
const mdBreakpoint = (styles: string): string => `
  @media (max-width: ${breakPoints.md}px) {
    ${styles}
  }
`;

/** At sm2 breakpoint (576px) and below: ensure list shrinks and border stays visible */
const sm2Breakpoint = (styles: string): string => `
  @media (max-width: ${breakPoints.sm2}px) {
    ${styles}
  }
`;

export const PlaceholderContainer = styled.div`
  display: flex;
  gap: 24px;
  flex-flow: column;
  width: 80%;
  margin: auto;
  height: 100%;

  ${mdBreakpoint(`
    width: 90%;
    height: auto;
    min-height: 0;
  `)}

  ${sm2Breakpoint(`
    width: 100%;
    padding: 0 12px;
    box-sizing: border-box;
  `)}
`;

export const ContentMapContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex: 1;
  border: 1px solid #d4d7dc;
  border-radius: 12px;
  overflow: hidden;

  ${sm2Breakpoint(`
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  `)}
`;

/** Map section - at md (1024px) and below: full width, fixed height (top of stack) */
export const MapSection = styled.div`
  flex: 1;
  min-width: 50%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  ${mdBreakpoint(`
    min-width: 100%;
    width: 100%;
    height: 40vh;
    min-height: 300px;
    flex: 0 0 auto;
  `)}
`;

/** List section - at md (1024px) and below: full width below map; at sm2: shrink and keep border */
export const ListSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  ${mdBreakpoint(`
    min-width: 100%;
    width: 100%;
    flex: none;
    height: auto;
    max-height: calc(100vh - 40vh);
    overflow-y: auto;
    overflow-x: hidden;
  `)}

  ${sm2Breakpoint(`
    min-width: 0;
    width: 100%;
    max-width: 100%;
  `)}
`;

export const Header = styled(H3)`
  margin-bottom: 12px;
`;
