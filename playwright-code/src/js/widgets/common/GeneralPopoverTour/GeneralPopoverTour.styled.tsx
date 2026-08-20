import styled from 'styled-components';
import { Popover, PopoverContent, PopoverHeader } from '@ids-ts/popover';
import { Button } from '@ids-ts/button';

// Individual dot active prop
export type DotActiveProps = { $active: boolean };

// Styled components
export const StyledPopover = styled(Popover)<{
  arrowColor?: string;
  position?: string;
}>`
  padding: 0px !important;
  max-height: 331px;
  max-width: 277px;
  position: relative;
  z-index: 999999 !important;
  :after {
    border-right-color: ${(props) =>
      props.position === 'right' ? props.arrowColor : 'auto'} !important;
    border-left-color: ${(props) =>
      props.position === 'left' ? props.arrowColor : 'auto'} !important;
  }

  [class*='Popover-noHeader-'] {
    position: absolute;
    top: 0;
    right: 0;
    margin: 20px;
    z-index: 1;
  }
`;

export const StyledPopoverWrapper = styled.div`
  background-color: var(--qbds-ef49e1);
  border-radius: 4px;
`;

export const MediaSection = styled.div<{ $bgcolor?: string }>`
  background: ${(props) => props.$bgcolor ?? '#E6FAEA'};
  padding: 8px;
  height: 168px;
  max-width: 277px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  overflow: hidden;
`;

export const MediaImage = styled.img`
  width: 100%;
  height: 156px;
  border-radius: 4px;
`;

export const ContentSection = styled.div`
  padding: 10px 15px;
`;

export const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: stretch;
  gap: 4px;
`;

export const DotsWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  gap: 8px;
  padding: 8px 0px;
`;

export const DotButton = styled.div<DotActiveProps>`
  height: 8px;
  width: 8px;
  background: ${(props) => (props.$active ? '#00892E' : '#E3E5E8')};
  border-radius: 50%;
  margin: 0;
  padding: 0;
  transition: background-color 0.2s ease;
`;

export const StyledPopoverContent = styled(PopoverContent)`
  height: 40px;
`;

export const ActionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-bottom: 8px;
`;

export const StyledButton = styled(Button)`
  padding-left: 8px !important;
  padding-right: 8px !important;
`;

export const BackButton = styled(Button)`
  margin-right: 8px !important;
  border: 2px solid !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
`;
