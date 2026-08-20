import styled, { createGlobalStyle } from 'styled-components';

// Styled bullet list used inside the intro modal's body. We render this
// as an actual <ul> rather than three lines of text so screen readers
// pick up the bullet semantics correctly.
export const IntroBulletList = styled.ul`
  margin: 4px 0 0 0;
  padding-left: 20px;
  text-align: left;
  list-style-type: disc;
  color: var(--color-text-primary, #1a1a1a);
`;

export const IntroBullet = styled.li`
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

/**
 * Scoped overrides that only apply while the Time Projects intro modal
 * is on screen.
 *
 * Targeting strategy:
 * - Outer scope:  `[data-testid^="guided-modal-time-project-intro"]`
 *   uniquely identifies this modal instance (other tours have different
 *   tour ids and so different test ids).
 * - Inner scope:  `[data-element="..."]` are stable hooks added on the
 *   shared GuidedModal styled components. We can't rely on
 *   `[class*="HeadlineContainer"]`-style selectors because the project
 *   doesn't use the styled-components babel plugin, so component class
 *   names compile to opaque hashes (e.g. `sc-aXmKLi`).
 *
 * What this does:
 * - Left-aligns the title ("Estimate time for projects") and the bullet
 *   body — the framework default centers both, which doesn't suit
 *   marketing copy with a multi-line list.
 * - Lets the body / content / headline containers grow so the third
 *   bullet ("Get real-time tracking…") isn't hidden behind the inner
 *   overflow scroller.
 * - Adds breathing room around the Lottie illustration.
 * - Strips the persistent focus/active background on the X close
 *   button so it doesn't look "stuck" after a click.
 */
export const IntroModalOverrides = createGlobalStyle`
  /* ---- Title + body left alignment ---- */
  /*
     The modal title sometimes rendered centered and sometimes left-
     aligned because IDS H4 typography ships its own text-align: center
     via a class that out-specifies a non-!important rule, and the
     HeadlineContainer flex container also defaults to align-items:
     center. We pin BOTH the container alignment AND the title /
     description text alignment to left with !important, and apply
     the rule directly to the H4 element as well as via the id selector
     so it wins regardless of which IDS class loads first.
  */
  [data-testid^="guided-modal-time-project-intro"]
    [data-element="guided-modal-headline"],
  [data-testid^="guided-modal-time-project-intro"]
    [data-element="guided-modal-content"],
  [data-testid^="guided-modal-time-project-intro"]
    [data-element="guided-modal-modal-content"] {
    align-items: flex-start !important;
    justify-content: flex-start !important;
    text-align: left !important;
  }
  [data-testid^="guided-modal-time-project-intro"]
    [data-element="guided-modal-headline"] [id="guided-modal-title"],
  [data-testid^="guided-modal-time-project-intro"]
    [data-element="guided-modal-headline"] h1,
  [data-testid^="guided-modal-time-project-intro"]
    [data-element="guided-modal-headline"] h2,
  [data-testid^="guided-modal-time-project-intro"]
    [data-element="guided-modal-headline"] h3,
  [data-testid^="guided-modal-time-project-intro"]
    [data-element="guided-modal-headline"] h4,
  [data-testid^="guided-modal-time-project-intro"]
    [data-element="guided-modal-content"] [id="guided-modal-description"],
  [data-testid^="guided-modal-time-project-intro"]
    [data-element="guided-modal-content"] p {
    text-align: left !important;
    width: 100% !important;
    align-self: stretch !important;
  }

  /* ---- Make sure all three bullets are visible ---- */
  [data-testid^="guided-modal-time-project-intro"]
    [data-element="guided-modal-body"],
  [data-testid^="guided-modal-time-project-intro"]
    [data-element="guided-modal-modal-content"],
  [data-testid^="guided-modal-time-project-intro"]
    [data-element="guided-modal-content"] {
    height: auto !important;
    max-height: none !important;
    overflow: visible !important;
  }

  /* ---- Lottie breathing room + contained sizing ---- */
  [data-testid^="guided-modal-time-project-intro"]
    [data-element="guided-modal-media"] {
    padding: 24px 32px !important;
  }

  /* ---- Modal close button: flat, no focus/active artefact ---- */
  [data-testid^="guided-modal-time-project-intro"]
    [class*="ModalHeader"] button,
  [data-testid^="guided-modal-time-project-intro"]
    [class*="modalHeader"] button,
  [data-testid^="guided-modal-time-project-intro"]
    [class*="controlsWrapper"] button {
    background-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }
  [data-testid^="guided-modal-time-project-intro"]
    [class*="ModalHeader"] button:hover,
  [data-testid^="guided-modal-time-project-intro"]
    [class*="modalHeader"] button:hover,
  [data-testid^="guided-modal-time-project-intro"]
    [class*="controlsWrapper"] button:hover,
  [data-testid^="guided-modal-time-project-intro"]
    [class*="ModalHeader"] button:focus,
  [data-testid^="guided-modal-time-project-intro"]
    [class*="modalHeader"] button:focus,
  [data-testid^="guided-modal-time-project-intro"]
    [class*="controlsWrapper"] button:focus,
  [data-testid^="guided-modal-time-project-intro"]
    [class*="ModalHeader"] button:focus-visible,
  [data-testid^="guided-modal-time-project-intro"]
    [class*="modalHeader"] button:focus-visible,
  [data-testid^="guided-modal-time-project-intro"]
    [class*="controlsWrapper"] button:focus-visible,
  [data-testid^="guided-modal-time-project-intro"]
    [class*="ModalHeader"] button:active,
  [data-testid^="guided-modal-time-project-intro"]
    [class*="modalHeader"] button:active,
  [data-testid^="guided-modal-time-project-intro"]
    [class*="controlsWrapper"] button:active {
    background-color: transparent !important;
    box-shadow: none !important;
    outline: none !important;
  }
`;
