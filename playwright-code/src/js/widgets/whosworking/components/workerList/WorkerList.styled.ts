import styled from 'styled-components';
import { IconControl } from '@ids-ts/icon-control';
import { Table } from '@ids-ts/table';
import { B3 } from '@ids-ts/typography';
import { Button } from '@ids-ts/button';
import { breakPoints } from 'src/js/common/screenSizeUtils';

export const WorkerListContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
`;

export const SearchContainer = styled.div`
  display: flex;
  margin-bottom: 1rem;
  padding: 1rem;
  align-items: flex-start;
`;

export const FilterControl = styled(IconControl)`
  margin-left: 1rem;
`;

export const PopoverContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 300px;
`;

export const WorkerListContent = styled.div`
  flex: 1;
  overflow-y: auto;
  min-width: 0;
  min-height: 0;
  -webkit-overflow-scrolling: touch;

  /* height:0 + flex-basis only when ListSection has a definite height (side-by-side); md stack uses ListSection scroll */
  @media (min-width: ${breakPoints.md + 1}px) {
    flex: 1 1 auto;
    height: 0;
  }

  // At smaller screen sizes (576px and below), allow horizontal scrolling for worker list
  @media (max-width: ${breakPoints.sm2}px) {
    overflow-x: auto;
  }
`;

export const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
`;

/**
 * Column widths based on ratio 267:135:70:100
 * Rounded to nice percentages that sum to 100%
 */
const COLUMN_WIDTHS = {
  name: '46%',
  hours: '24%',
  map: '12%',
  action: '18%',
};

export const StyledTable = styled(Table)`
  width: 100%;

  /* Prevent header text from being capitalized */
  th,
  [role='columnheader'] {
    text-transform: none;
  }

  /* Apply column widths via nth-child */
  th,
  td,
  [role='columnheader'],
  [role='cell'] {
    &:nth-child(1) {
      width: ${COLUMN_WIDTHS.name};
    }
    &:nth-child(2) {
      width: ${COLUMN_WIDTHS.hours};
    }
    &:nth-child(3) {
      width: ${COLUMN_WIDTHS.map};
    }
    &:nth-child(4) {
      width: ${COLUMN_WIDTHS.action};
      text-align: right;
    }
  }

  /* Below 576px: allow table to scroll horizontally instead of clipping */
  @media (max-width: ${breakPoints.sm2}px) {
    min-width: 480px;
  }
`;

export const WorkerRow = styled(Table.Row)`
  &:hover {
    background-color: #f7f8f9;
  }
`;

export const WorkerCell = styled(Table.Cell)`
  vertical-align: middle;
`;

export const LoadingMoreContainer = styled(Table.Row)`
  td {
    text-align: center;
    padding: 1rem;
  }
`;

export const LoadingMoreContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: #6b7177;
`;

// Hours cell styled components - placeholders for CSS customization
export const HoursCellContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const TimeOnClock = styled(B3)`
  color: #00892e;
`;

// Profile avatar showing user's first initial
// Matches WorkerMarker styling (40px, circular, orange border when selected)
export const ProfileAvatarContainer = styled.div<{ $isSelected?: boolean }>`
  border: ${(props) =>
    props.$isSelected ? '2px solid #ff8000' : '2px solid transparent'};
  border-radius: 50%;
`;

export const ProfileAvatar = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #00892e;
  color: #ffffff;
  border: 2px solid #ffffff;
  box-sizing: border-box;
`;

export const WorkerNameContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const WorkerNameDetails = styled.div`
  display: flex;
  flex-flow: column;
  gap: 0.25rem;
`;

export const ActionButton = styled(Button)`
  padding-right: 0 !important;
  justify-content: flex-end !important;
`;
