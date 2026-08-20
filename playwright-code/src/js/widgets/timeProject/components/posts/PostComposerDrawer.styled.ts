import styled from 'styled-components';

// Anchors the full-drawer loading overlay.
export const ContentWrapper = styled.div`
  position: relative;
  min-height: 100%;
`;

export const ComposerSubtitle = styled.div`
  /* 20px gap between the subtitle and the text area. */
  margin-bottom: 20px;
`;

export const ComposerBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  /* The text area is a fixed 520x200 box and must not be resizable. IDS
     sets the width via its width prop; we lock the height and disable
     resize on the rendered textarea inside the IDS wrapper. */
  textarea {
    height: 200px;
    min-height: 200px;
    max-height: 200px;
    resize: none;
  }

  /* Placeholder ("Type your post") in a lighter grey. */
  textarea::placeholder {
    color: #859299;
  }
`;

export const CharCount = styled.div<{ $error?: boolean }>`
  align-self: flex-start;
  color: ${({ $error }) => ($error ? '#d52b1e' : '#6b6c72')};
`;

export const AttachRow = styled.div`
  display: flex;
  -webkit-box-align: center;
  align-items: start;
  padding-top: 8px;
  flex-direction: column;
  text-align: left;
`;

// Icon + label inside the IDS attach Button (IDS Button has no icon prop).
export const AttachLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

// Helper text under the attach button, 20px below it.
export const AttachHint = styled.div`
  color: #6b6c72;
  margin-top: 20px;
`;

export const ErrorContainer = styled.div`
  margin-bottom: 16px;
`;

// Footer action sits on the right.
export const FooterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  width: 100%;
`;

// Full-drawer loading overlay shown while a post is saving.
export const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  z-index: 1;
`;
