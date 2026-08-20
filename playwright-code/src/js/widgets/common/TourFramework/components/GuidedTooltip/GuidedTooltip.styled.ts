import styled, { createGlobalStyle } from 'styled-components';

/**
 * Global styles to customize GuidedTourTooltip
 * Overrides IDS component styles for our specific design requirements:
 * - Total tooltip: auto height x 277px width
 * - Image container: 168px height x 277px width
 * - Progress dots: ~24px
 * - Content section: auto height with padding
 * - Footer: ~52px
 * - Hide default title
 * - Remove padding so image goes edge-to-edge
 * - Z-index lower than trowsers so tour is covered when trowser opens
 */
export const HideTitleStyles = createGlobalStyle`
  /* Set z-index: 999 (below trowsers ~1050) - inline stylePosition is primary, this is backup */
  [data-automation-id^="guided-tour-tooltip"],
  div[class*="GuidanceTooltip-desktopWebWrapperGuidedTour"] {
    z-index: 999 !important;
  }

  /* Overlays below tour */
  div[class*="Spotlight"],
  div[class*="CoachMarks"],
  div[class*="Backdrop"] {
    z-index: 998 !important;
  }

  /* Override tooltip wrapper dimensions and remove all padding */
  .hide-tooltip-title {
    width: 277px !important;
    min-width: 277px !important;
    max-width: 277px !important;
    height: auto !important;
    min-height: auto !important;
    padding: 0 !important;
    border: 1px solid rgba(244, 240, 240, 0.9) !important; /* Light border */
    display: flex !important;
    flex-direction: column !important;
  }
  
  /* Remove padding from inner wrapper */
  .hide-tooltip-title > div {
    padding: 0 !important;
  }
  
  /* Hide the default IDS title (targets only the library's title element) */
  .hide-tooltip-title > div > h3,
  .hide-tooltip-title > div > h5 {
    display: none !important;
  }
  
  /* Remove padding from message container so image goes edge-to-edge */
  .hide-tooltip-title div[class*="message"] {
    padding: 0 !important;
    margin: 0 !important;
  }
  
  /* Section 3: Footer - Always at bottom with horizontal alignment */
  .hide-tooltip-title div[class*="Footer"],
  .hide-tooltip-title div[class*="gttFooter"] {
    padding: 12px 16px !important;
    margin: 0 !important;
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    justify-content: space-between !important;
  }

  /* Keep buttons in horizontal layout */
  .hide-tooltip-title div[class*="Footer"] > div,
  .hide-tooltip-title div[class*="gttFooter"] > div {
    display: flex !important;
    flex-direction: row !important;
    align-items: center !important;
    gap: 8px !important;
  }

  /* Make buttons flexible width to accommodate longer text */
  .hide-tooltip-title div[class*="Footer"] button,
  .hide-tooltip-title div[class*="gttFooter"] button {
    width: auto !important;
    min-width: fit-content !important;
    max-width: none !important;
    white-space: nowrap !important;
    flex-shrink: 0 !important;
  }
`;

/* Section 1: Image and Dots */
export const ImageSection = styled.div`
  position: relative;
`;

export const LottieSection = styled.div`
  width: 100%;
  height: 168px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  overflow: hidden;

  /* Ensure images render properly */
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
`;

export const ProgressDots = styled.div`
  display: flex;
  gap: 6px;
  justify-content: center;
  padding: 8px 0;
`;

export const ProgressDot = styled.div<{ active: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ active }) => (active ? '#2c6b2f' : '#d1d1d1')};
  transition: background-color 0.2s ease;
`;

/* Section 2: Content Section */
export const ContentSection = styled.div`
  width: 100%;
  padding-right: 4px;
  padding-left: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow-y: visible;
`;

export const StepTitle = styled.div<{ $noMedia?: boolean }>`
  font-size: 14px;
  font-weight: 600;
  margin: ${({ $noMedia }) => ($noMedia ? '20px 10px' : '0 0 8px 0')};
  color: #393a3d;
  line-height: 1.3;
`;

export const Description = styled.div<{ $noMedia?: boolean }>`
  font-size: 13px;
  line-height: 1.5;
  color: #6b6c72;
  ${({ $noMedia }) => ($noMedia ? 'margin: 5px 10px;' : '')}
`;

/* Button footer for single-step tours - right-aligned button */
export const ButtonFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 16px 12px 20px;
  background: white;
  float: right;

  /* Make button more compact */
  button {
    padding: 4px 12px !important;
    min-height: 26px !important;
    max-height: 26px !important;
    font-size: 12px !important;
    line-height: 1.2 !important;
    border-radius: 3px !important;

    /* Override typography inside button */
    span {
      font-size: 12px !important;
      line-height: 1.2 !important;
      font-weight: 600 !important;
    }
  }
`;

/* Custom footer for single-step tours (IDS doesn't render footer when stepCount <= 1) */
export const SingleStepFooter = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;

  span {
    font-size: 13px;
    color: #6b6c72;
  }

  button {
    background-color: #2ca01c;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background-color: #248a17;
    }

    &:focus {
      outline: 2px solid #2ca01c;
      outline-offset: 2px;
    }
  }
`;
