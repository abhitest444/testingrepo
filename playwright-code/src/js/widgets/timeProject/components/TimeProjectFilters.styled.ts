import styled from 'styled-components';
import { Popover } from '@ids-ts/popover';
import Button from '@ids-ts/button';

export const FiltersContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
`;

export const FilterItem = styled.div`
  width: 200px;
`;

export const SearchItem = styled.div`
  max-width: 320px;

  > button {
    margin: 18px 0 0;
  }
`;

export const CustomRangePopover = styled(Popover)`
  /* overrides @ids-ts/popover default max-width */
  width: 460px !important;
  min-height: 200px;
`;

export const CustomRangeApplyButton = styled(Button)<{ $hasError: boolean }>`
  ${({ $hasError }) => $hasError && 'margin-top: 0;'}
`;
