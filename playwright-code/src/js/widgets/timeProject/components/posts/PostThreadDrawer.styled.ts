import styled from 'styled-components';

// Flex column that fills the drawer panel. The ThreadBody grows to consume
// available space while the ReplyComposer stays pinned at the bottom.
export const ContentWrapper = styled.div`
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const ThreadBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

// Outer card holding the parent post + its replies.
export const ThreadCard = styled.div`
  border: 1px solid #d5dee3;
  border-radius: 8px;
  padding: 20px;
`;

// A single reply row inside the thread card — indented under the parent.
export const ReplyRow = styled.div`
  margin-top: 20px;
`;

export const ReplyAuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const ReplyAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e3e5e8;
  color: #4a4f54;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
`;

export const ReplyAuthorMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const ReplyAuthorName = styled.div`
  color: #393a3d;
`;

export const ReplyTimestamp = styled.div`
  color: #6b6c72;
`;

export const ReplyContent = styled.div`
  margin-top: 8px;
  padding-left: 44px;
  color: #393a3d;
  white-space: pre-line;
  word-break: break-word;
`;

export const ParentDivider = styled.hr`
  border: none;
  border-top: 1px solid #e3e5e8;
  margin: 16px 0 0;
`;

// Reply composer pinned to the bottom of the drawer content area.
export const ReplyComposer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
  padding-top: 12px;

  textarea {
    height: 120px;
    min-height: 120px;
    max-height: 120px;
    resize: none;
  }
`;

export const ReplyCharCount = styled.div<{ $error?: boolean }>`
  align-self: flex-start;
  color: ${({ $error }) => ($error ? '#d52b1e' : '#6b6c72')};
`;

export const ErrorContainer = styled.div`
  margin-bottom: 16px;
`;

export const FooterActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
  width: 100%;
`;

export const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.6);
  z-index: 1;
`;

export const RepliesPaginationFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 8px 0 0;
`;
