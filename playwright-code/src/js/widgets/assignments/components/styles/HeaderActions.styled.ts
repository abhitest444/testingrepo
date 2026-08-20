import styled from 'styled-components';

/**
 * Header Actions Styled Components
 * Layout and styling for the three header action buttons
 */

/**
 * Container for header action buttons
 * Displays buttons horizontally with proper spacing
 * Aligned to the RIGHT side of the container
 * Matches CustomerAssignmentsTab button layout
 */
export const HeaderActionsContainer = styled.div`
  display: flex;
  gap: 16px; /* Match CustomerAssignmentsTab gap */
  align-items: center;
  justify-content: flex-end; /* Right alignment */
  width: 100%;
  flex-wrap: wrap;
`;
