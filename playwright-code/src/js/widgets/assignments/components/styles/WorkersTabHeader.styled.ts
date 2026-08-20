import styled from 'styled-components';

/**
 * Workers Tab Header Styled Components
 * Layout and styling for the tab-level header section
 */

/**
 * Main container for the entire tab header section
 * Stacks header actions and search filters vertically
 */
export const WorkersTabHeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  align-items: flex-end; /* Ensure child elements align to the right */
`;

/**
 * Container for search and filter inputs
 * Displays them horizontally with proper sizing
 */
export const FilterContainer = styled.div`
  display: flex;
  gap: 16px;
  align-items: flex-start;

  /* Worker type dropdown - fixed width */
  > div:first-child {
    width: 200px;
    flex-shrink: 0;
  }

  /* Search field - flexible width with max constraint */
  > div:last-child {
    flex: 1;
    max-width: 400px;
  }
`;
