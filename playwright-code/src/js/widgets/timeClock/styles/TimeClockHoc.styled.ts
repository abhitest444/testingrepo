import styled from 'styled-components';
import { DrawerHeader, DrawerFooter, DrawerContent } from '@ids-ts/drawer';
import { ModalContent } from '@ids-ts/modal-dialog';
import { B2 } from '@ids-ts/typography';
import { ConfirmationModal } from '../../common/ConfirmationModal';

export const StyledDrawerHeader = styled.div`
  box-shadow: #00000040 0px 2px 2px;
  padding: 0 10px;
  font-weight: var(--font-weight-component-semibold);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
`;

export const StyledDrawerFooter = styled(DrawerFooter)`
  > div:first-child > div:nth-child(2) {
    margin-left: unset;
  }
`;

export const StyledDrawerContent = styled(DrawerContent)`
  text-align: center;
`;

export const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
`;

export const OverlayContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 400px; /* Ensure minimum height for overlay positioning */
`;

export const BlurOverlay = styled.div<{ isLoading: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-container-overlay);
  display: ${(props) => (props.isLoading ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  z-index: 1;
`;

export const StyledDescriptionConfirmationMessage = styled.div`
  font-size: var(--font-size-body-2);
  line-height: var(--line-height-component);
`;

export const StyledModalContent = styled(ModalContent)`
  padding-top: 16px;
  display: flex;
  justify-content: flex-start;
  span {
    text-align: left;
    margin: 0;
  }
`;

export const StyledConfirmationModal = styled(ConfirmationModal)`
  width: 465px;
`;

export const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

export const HeaderBackButton = styled(B2)`
  font-family: inherit;
  min-width: 93px;

  button {
    padding-right: 2px;
    padding-left: 0;
  }
`;
