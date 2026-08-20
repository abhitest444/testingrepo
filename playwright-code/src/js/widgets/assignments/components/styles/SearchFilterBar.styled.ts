import styled from 'styled-components';

/**
 * Search Filter Bar Styled Components
 * Layout and styling for search input, filter dropdown, and view toggle
 */

/**
 * Main container for the search filter bar
 * Displays components horizontally with proper spacing
 * Layout: [Worker Type Dropdown] [Search Input] -------- [View Toggle]
 */
export const SearchFilterBarContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 24px 0 12px;
`;

/**
 * Left section container for filter and search
 * Groups the worker type filter and search input together
 * Uses flex-end to align input fields at the bottom (dropdown has label above)
 * Allows SearchField to expand within max-width constraint
 */
export const LeftSection = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex: 1;
`;

/**
 * Right section container for view toggle
 * Pushes the toggle to the far right using margin-left: auto
 */
export const RightSection = styled.div`
  display: flex;
  align-items: center;
  margin-left: auto;
  flex-shrink: 0;
`;

/**
 * Container for the worker type filter dropdown
 * Fixed width from Figma: 164px
 */
export const FilterContainer = styled.div`
  width: 164px;
`;

/**
 * Container for the search input field
 * Allows SearchField to expand with max-width constraint (matches Customer Assignments)
 */
export const SearchContainer = styled.div`
  flex: 1;
  max-width: 400px;
`;

/**
 * Wrapper that applies custom styles to the Toggle component.
 * Needed because Toggle does not forward the className prop.
 */
export const StyledToggleWrapper = styled.div`
  [class*='Toggle-selected'] {
    font-weight: 700 !important;
  }
`;
