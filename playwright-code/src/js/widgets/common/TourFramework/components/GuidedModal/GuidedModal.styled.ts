import styled, { createGlobalStyle } from 'styled-components';
import Button from '@ids-ts/button';
import {
  ModalHeader as IDSModalHeader,
  ModalContent as IDSModalContent,
  ModalActions as IDSModalActions,
} from '@ids-ts/modal-dialog';

/**
 * Props for styled components
 */
export type MediaSectionProps = { bgcolor?: string; itemAlignment?: string };
export type DotProps = { active?: boolean };
export type ImageProps = { imageMargin?: string };

/**
 * Global styles to remove default IDS Modal padding
 * Allows media section to extend edge-to-edge
 * Works across different repositories and widget contexts
 * NOTE: Targets IDS Modal internal classes only (Paper, MuiPaper, etc.) to avoid overriding custom styled components
 */
export const HideModalPaddingStyles = createGlobalStyle`
  /* Remove padding from IDS Modal paper/container */
  [data-testid^="guided-modal"][class*="Modal"],
  [data-testid^="guided-modal"] [class*="Paper"],
  [data-testid^="guided-modal"] [class*="paper"],
  [data-testid^="guided-modal"] [class*="MuiPaper"],
  [data-testid^="guided-modal"] [class*="MuiDialog"] {
    padding: 0 !important;
    padding-top: 0 !important;
  }

  /* Target modal dialog role specifically */
  [data-testid^="guided-modal"][role="dialog"],
  [data-testid^="guided-modal"] [role="dialog"] {
    padding: 0 !important;
  }

  /* Remove padding from IDS Modal immediate wrapper divs (not styled components) */
  [data-testid^="guided-modal"] > [class*="Modal"],
  [data-testid^="guided-modal"] > div[class*="ids"],
  [data-testid^="guided-modal"] > div > [class*="Modal"] {
    padding: 0 !important;
    padding-top: 0 !important;
  }

  /* Position modal header (close button) over the image */
  [data-testid^="guided-modal"] [class*="ModalHeader"],
  [data-testid^="guided-modal"] [class*="modalHeader"],
  [data-testid^="guided-modal"] [class*="controlsWrapper"] {
    position: absolute !important;
    top: 8px !important;
    right: 8px !important;
    z-index: 10 !important;
    padding: 0 !important;
    margin: 0 !important;
    background: transparent !important;
    min-height: 0 !important;
    height: auto !important;
  }

  /* Override IDS ModalActions default styles - dots left, buttons right */
  [data-testid^="guided-modal"] [class*="ModalActions"],
  [data-testid^="guided-modal"] [class*="modalActions"] {
    display: flex !important;
    flex-direction: row !important;
    justify-content: space-between !important;
    align-items: center !important;
    flex-wrap: nowrap !important;
  }

  /* Ensure button container stays on the right */
  [data-testid^="guided-modal"] [class*="ModalActions"] > div:last-child,
  [data-testid^="guided-modal"] [class*="modalActions"] > div:last-child {
    margin-left: auto !important;
  }
`;

/**
 * Modal wrapper for positioning and close button styling
 */
export const ModalWrapper = styled.div`
  position: relative;
  padding: 0 !important;
  margin: 0 !important;

  /* Override padding on the IDS close-icon wrapper */
  &[class] [class*='controlsWrapper'] {
    padding-top: 8px !important;
  }

  /* Remove any gap from immediate children */
  & > * {
    margin-top: 0 !important;
  }
`;

/**
 * Styled Modal Header - absolutely positioned over media section
 */
export const StyledModalHeader = styled(IDSModalHeader)`
  position: absolute !important;
  top: 8px !important;
  right: 8px !important;
  z-index: 10;
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
  min-height: 0 !important;
  height: auto !important;
  border: none !important;
`;

/**
 * Media image styling
 */
export const MediaImage = styled.img<ImageProps>`
  width: 100%;
  border-radius: 25px;
  margin: ${(p) => p?.imageMargin || '0 auto'};
  object-fit: contain;
`;

/**
 * Media section - placeholder for Lottie/Image
 */
export const MediaSection = styled.div<MediaSectionProps>`
  display: flex;
  justify-content: center;
  align-items: ${(p) => p?.itemAlignment || 'center'};
  height: 360px;
  background: ${(p) => p?.bgcolor || 'var(--color-kiwi-10, #e6f4ea)'};
  position: relative;
  overflow: hidden;
  margin: 0 !important;
  padding: 0 !important;

  @media (max-width: 1024px) {
    height: 275px;
  }
  @media (max-width: 768px) {
    height: 205px !important;
  }
  @media (max-width: 480px) {
    height: 160px !important;
  }
`;

/**
 * Modal body container - uses min-height so the modal stays at a
 * consistent baseline size for short copy, but grows to fit longer
 * content (e.g. multi-bullet intro modals) instead of clipping the
 * tail behind ContentContainer's inner overflow.
 */
export const ModalBodyContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 220px;

  @media (max-width: 768px) {
    max-width: 95vw;
    min-height: 180px;
  }
  @media (max-width: 480px) {
    max-width: 100vw;
    min-height: 160px;
  }
`;

/**
 * Styled Modal Content - fixed height content area
 */
export const StyledModalContent = styled(IDSModalContent)`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 0;
  padding: 0;
  margin: 0;
  overflow: hidden;
`;

/**
 * Headline container
 */
export const HeadlineContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px 48px 8px 48px;
  text-align: center;
  @media (max-width: 768px) {
    padding: 12px 24px 6px 24px;
  }
  @media (max-width: 480px) {
    padding: 8px 16px 4px 16px;
  }
`;

/**
 * Content/description container - centered text
 */
export const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  flex: 1 1 auto;
  width: 100%;
  padding: 0 48px 16px 48px;
  text-align: center;
  overflow-y: auto;
  @media (max-width: 768px) {
    padding: 0 24px 12px 24px;
  }
  @media (max-width: 480px) {
    padding: 0 16px 8px 16px;
  }
`;

/**
 * Progress dots container
 */
export const StepDots = styled.div`
  display: flex;
  margin-left: 0px;
  gap: 8px;
  @media (max-width: 768px) {
    justify-content: center;
  }
`;

/**
 * Individual progress dot
 */
export const Dot = styled.div<DotProps>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) =>
    p.active
      ? 'var(--color-action-standard, #0d3c26)'
      : 'var(--color-border-default, #E3E5E8)'};
  transition: background-color 0.2s ease;
`;

/**
 * Styled Modal Actions - footer with dots left, buttons right
 */
export const StyledModalActions = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between !important;
  width: 100%;
  flex: 0 0 auto;
  height: 72px;
  padding: 0 24px 20px 24px !important;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    align-items: center;
    justify-content: center;
    gap: 12px;
    height: auto;
    padding: 12px 16px !important;
  }
`;

/**
 * Actions row for navigation buttons
 */
export const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 16px;

  @media (max-width: 768px) {
    justify-content: center;
    gap: 12px;
  }
`;

/**
 * Back button (secondary style) - white with themed border
 */
export const BackButton = styled(Button)`
  background-color: var(--color-container-background-primary, white) !important;
  color: var(--color-action-standard, #0d3c26) !important;
  border: 2px solid var(--color-action-standard, #0d3c26) !important;
  border-radius: var(--radius-action);

  &:hover {
    background-color: var(
      --color-action-passive-subtle-hover,
      #f5f5f5
    ) !important;
  }
`;

/**
 * Action button (primary style) - solid dark green
 */
export const ActionButton = styled(Button)`
  color: white !important;
  border: none !important;
  border-radius: var(--radius-action);
`;

/**
 * Footer left section (for dots)
 */
export const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  justify-content: flex-start;
  float: left;

  @media (max-width: 768px) {
    justify-content: center;
    width: 100%;
  }
`;

/**
 * Footer right section (for buttons)
 */
export const FooterRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 0 0 auto;
`;
