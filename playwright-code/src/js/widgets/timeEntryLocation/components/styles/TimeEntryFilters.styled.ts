import styled from 'styled-components';
import { breakPoints } from '../../../../common/screenSizeUtils';

// Filters wrapper
export const FiltersWrapper = styled.div`
  display: flex;
  flex-direction: column;

  /* Force IDS Dropdown to take full width */
  * [class^='DropdownTypeahead-wrapper'],
  * [class*='Dropdown-dropdownContainer-'],
  * [class*='Dropdown-textField-'] {
    width: 100% !important;
  }

  [class^='idsTSDropdown'] [class^='TextField-quickbooks'] {
    width: 100% !important;
  }
`;

// Filter row
export const FilterRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: left;
  align-items: center;
  gap: 20px;

  /* Ensure first child field takes full width */
  div:first-child {
    width: 100%;
    div:first-child {
      width: inherit;
    }
  }

  /* On smaller screens, stack fields vertically */
  @media (max-width: ${breakPoints.sm2}px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
`;

// Filter field
export const FilterField = styled.div`
  flex: 1;
  min-width: 0;
`;

// Full width field
export const FullWidthField = styled.div`
  width: 100%;
`;

// Details section
export const DetailsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

// Timesheet flags row - label followed by wrapped chips
export const TimesheetFlagsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const TimesheetFlagsChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;
