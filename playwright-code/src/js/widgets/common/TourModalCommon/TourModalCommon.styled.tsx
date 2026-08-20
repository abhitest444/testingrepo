import styled from 'styled-components';
import Button from '@ids-ts/button';
import {
  ModalHeader as IDSModalHeader,
  ModalContent as IDSModalContent,
  ModalActions as IDSModalActions,
} from '@ids-ts/modal-dialog';

export type HeroProps = { bgcolor?: string; itemAlignment?: string };
export type DotProps = { active?: boolean };
export type ImageProps = { imageMargin?: string };

export const MediaImage = styled.img<ImageProps>`
  width: 100%;
  border-radius: 25px;
  margin: ${(p) => p?.imageMargin || '0 auto'};
  object-fit: contain;
`;

export const StepDots = styled.div`
  display: flex;
  gap: 8px;
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

export const Dot = styled.div<DotProps>`
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: ${(p) =>
    p.active
      ? 'var(--color-brand-green-100, #128644)'
      : 'var(--color-brand-green-20, #e6f4ea)'};
`;

export const ActionsRow = styled.div`
  display: flex;
  width: 554px;
  justify-content: flex-end;
  align-items: center;
  margin: 0 !important;
  gap: 16px;

  @media (max-width: 768px) {
    width: 100%;
    box-sizing: border-box;
    padding: 0 16px;
    flex-direction: column;
    gap: 8px;
  }
`;

export const HeadlineContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spaceContainerPaddingSmall, 16px) 0;
  @media (max-width: 768px) {
    padding: 12px 16px;
  }
  @media (max-width: 480px) {
    padding: 8px;
  }
`;

export const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 44px;
  padding: 0;
  justify-content: flex-start;
  align-self: stretch;
  text-align: center;
  @media (max-width: 768px) {
    padding: 0 16px;
  }
  @media (max-width: 480px) {
    padding: 0 8px;
  }
`;

export const ModalBodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  @media (max-width: 768px) {
    max-width: 95vw;
  }
  @media (max-width: 480px) {
    max-width: 100vw;
  }
`;

export const BackButton = styled(Button)`
  border: 2px solid !important;
  border-radius: var(--radius-action);
  @media (max-width: 768px) {
    width: 100% !important;
  }
`;

export const ResponsiveButton = styled(Button)`
  @media (max-width: 768px) {
    width: 100% !important;
  }
`;

export const ModalFooter = styled.div`
  height: 76px;
  margin: 0 !important;
  padding: 0 46px 0 0;
  justify-content: center;
  align-items: center;

  @media (max-width: 768px) {
    height: auto;
    padding: 8px 16px;
    box-sizing: border-box;
  }
`;

export const StyledModalHeader = styled(IDSModalHeader)`
  padding: 0 8px 0 0 !important;
`;

export const MediaSection = styled.div<HeroProps>`
  display: flex;
  justify-content: center;
  align-items: ${(p) => p?.itemAlignment || 'center'};
  height: 312px;
  background: ${(p) => p?.bgcolor || 'var(--color-kiwi-10, #000)'};
  position: relative;
  overflow: hidden;

  @media (max-width: 1024px) {
    height: 260px;
  }
  @media (max-width: 768px) {
    height: 190px !important;
  }
  @media (max-width: 480px) {
    height: 145px !important;
  }
`;

export const ModalWrapper = styled.div`
  position: relative;

  /* Override padding on the IDS close-icon wrapper (<div class="...controlsWrapper…">) */
  &[class] [class*='controlsWrapper'] {
    padding-top: 8px !important;
  }
`;

export const StyledModalContent = styled(IDSModalContent)`
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  gap: 5px;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  max-height: 50vh;
`;

export const StyledModalActions = styled(IDSModalActions)`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around !important;
  width: 100%;
  height: 92px;
  padding: 0 0 16px 0 !important;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    align-items: stretch;
    justify-content: center;
    gap: 12px;
    height: auto;
    padding: 0 0 8px 0 !important;
  }
`;
