import styled from 'styled-components';
import {
  DrawerHeader as IDSDrawerHeader,
  DrawerFooter as IDSDrawerFooter,
  DrawerContent as IDSDrawerContent,
} from '@ids-ts/drawer';

export const StyledDrawerHeader = styled(IDSDrawerHeader)<{
  showBoxShadow?: boolean;
}>`
  box-shadow: ${(props) =>
    props.showBoxShadow
      ? '0px 2px 8px 0px rgba(0, 0, 0, 0.2) !important'
      : 'none !important'};
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: var(--color-container-background-primary, #ffffff);
`;

export const StyledDrawerFooter = styled(IDSDrawerFooter)`
  box-shadow: inset 0px 1px 0px 0px #d4d7dc;
  background-color: var(
    --color-container-background-primary,
    #ffffff
  ) !important;
`;

export const StyledDrawerContent = styled(IDSDrawerContent)`
  mask-image: none !important;

  > div {
    padding: 20px 20px 16px 20px;
  }
`;

export const FooterButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
  padding: 0;
`;

export const GroupDetailsContentContainer = styled.div`
  padding: 0 20px 0;
`;

export const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-bottom: 20px;
`;

export const SectionTitle = styled.p`
  font-size: 16px;
  font-weight: 500;
  line-height: 24px;
  color: var(--color-text-primary, #393a3d);
  margin: 16px 0 0 0;
`;

export const SectionDescription = styled.div`
  margin: 8px 0 0 0;

  p {
    margin: 0;
    color: var(--color-text-primary, #393a3d);
  }
`;

export const SectionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 4px;
`;

export const WorkerAssignmentRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

export const Divider = styled.div`
  height: 1px;
  background-color: #d4d7dc;
  margin: 16px 0;
  width: 100%;
`;

export const ModalMessage = styled.div`
  padding-top: 16px;
`;
