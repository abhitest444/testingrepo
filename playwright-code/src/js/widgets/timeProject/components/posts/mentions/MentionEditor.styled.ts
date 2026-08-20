import styled from 'styled-components';

// Wrapper that establishes the positioning context for the caret-anchored
// mention menu and lets the contenteditable sit in the IDS field's box.
export const EditorShell = styled.div`
  position: relative;
  width: 100%;
`;

// The contenteditable editing surface. It wears the real IDS textarea input
// className (applied at runtime) so border, padding, radius, font, focus ring,
// white background and the error background all come from the design system.
// These rules only (a) override the box geometry the IDS input class assumes
// (it ships a fixed 94px height / top margin) so the composer's 200px,
// non-resizable box wins, and (b) style the inline mention badge.
export const Editable = styled.div`
  && {
    height: 100px;
    min-height: 100px;
    max-height: 100px;
    margin-top: 0;
    width: 100%;
    box-sizing: border-box !important;
    border-width: 1px !important;
    border-style: solid !important;
    border-radius: 4px;
    overflow-y: auto;
    resize: none;
    white-space: pre-wrap;
    word-break: break-word;
    cursor: text;
  }

  &:focus {
    border-width: 2px !important;
    outline: none;
  }

  &:empty::before {
    content: attr(data-placeholder);
    color: #859299;
    pointer-events: none;
  }

  /* Host node for a mention. It's an atomic, non-editable inline box that holds
     a real IDS <Badge> (rendered via portal); the visual styling is the Badge's
     own, so the host only handles inline layout + non-selectability. No close
     affordance — removal is via Backspace. */
  .ids-mention-host {
    display: inline-flex;
    align-items: center;
    vertical-align: baseline;
    margin: 0 1px;
    user-select: none;
    white-space: nowrap;
  }
`;

// Inline validation message shown below the editor (mirrors IDS error text:
// 14px, negative-red). Rendered by us because the real IDS TextArea that
// supplies styling is visually hidden.
export const ValidationMessage = styled.div`
  margin-top: 4px;
  font-size: 14px;
  line-height: 1.5;
  color: #d52b1e;
`;
