import styled from 'styled-components';
import Badge from '@ids-ts/badge';
import { PopoverContent } from '@ids-ts/popover';

export const DeleteModalBadge = styled(Badge)`
  transform: scale(1.8);
`;

export const FeedContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
`;

export const FeedToolbar = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 64px 0;
`;

export const PostsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

// Force the IDS Card (and the clickable wrapper IDS renders around it) to
// span the full feed width. Drop the IDS drop-shadow (base + hover) and use
// the requested border colour. IDS class names are hashed, so we target the
// stable "Cards-*" prefixes.
export const CardWrapper = styled.div`
  width: 100%;

  & > * {
    width: 100%;
  }

  & [class*='Cards-card-'] {
    box-shadow: none;
    border-color: #d5dee3;
  }

  & [class*='Cards-clickable-']:hover {
    box-shadow: none;
  }
`;

export const PostAuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const Avatar = styled.div<{ $compact?: boolean }>`
  width: ${({ $compact }) => ($compact ? '32px' : '40px')};
  height: ${({ $compact }) => ($compact ? '32px' : '40px')};
  border-radius: 50%;
  background: #e3e5e8;
  color: #4a4f54;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ $compact }) => ($compact ? '12px' : '13px')};
  font-weight: 600;
  flex-shrink: 0;
`;

// A reply row inside the thread card — sits under the parent post, indented
// so it reads as nested under the original post.
export const ReplyRow = styled.div`
  margin-top: 28px;
  padding-left: 60px;
  padding-bottom: 20px;
`;

// Replies region inside the thread card. Uses viewport-relative height so it
// dynamically fills the space between the parent post and the reply composer.
export const RepliesScroll = styled.div<{ $scroll?: boolean }>`
  ${({ $scroll }) =>
    $scroll
      ? `
    position: relative;
    max-height: calc(100vh - 500px);
    min-height: 120px;
    overflow-y: auto;
    &::after {
      content: '';
      display: block;
      position: sticky;
      bottom: 0;
      left: 0;
      right: 0;
      height: 32px;
      background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.05));
      pointer-events: none;
    }
  `
      : ''}
`;

export const RepliesLoadingMore = styled.div`
  display: flex;
  justify-content: center;
  padding: 12px 0;
`;

export const AuthorMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const AuthorName = styled.div`
  color: #393a3d;
`;

export const PostTimestamp = styled.div`
  color: #6b6c72;
`;

export const PostBody = styled.div<{ $noClamp?: boolean; $compact?: boolean }>`
  margin-top: 16px;
  padding-left: ${({ $compact }) => ($compact ? '44px' : '60px')};
  padding-right: 32px;
  color: #393a3d;
  word-break: break-word;
  white-space: pre-line;

  /* On the feed card the content is a preview — clamp to 2 lines with an
     ellipsis; the full content shows in the post thread drawer
     (noClamp). pre-line preserves newlines while allowing the clamp. */
  ${({ $noClamp }) =>
    $noClamp
      ? ''
      : `
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  `}
`;

// @-mention inside post content, styled as an inline chip.
export const Mention = styled.span`
  display: inline;

  & div {
    display: inline;
  }
`;

// http/https link inside post content — opens in a new tab.
export const PostLink = styled.a`
  color: #0077c5;
  text-decoration: underline;
  word-break: break-all;
`;

export const PostDivider = styled.hr`
  border: none;
  border-top: 1px solid #e3e5e8;
  margin: 12px 0 16px;
  margin-left: 60px;
  margin-right: 32px;
`;

export const PostRepliesLink = styled.button<{ $clickable?: boolean }>`
  color: #0077c5;
  background: none;
  border: none;
  padding: 0;
  padding-left: 60px;
  font: inherit;
  text-align: left;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};

  /* No hover styling beyond the cursor — keep colour/background/underline
     unchanged on hover and focus, and drop the focus box-shadow. */
  &:hover,
  &:focus,
  &:focus-visible,
  &:active {
    color: #0077c5;
    background: none;
    text-decoration: none;
    outline: none;
    box-shadow: none !important;
  }
`;

export const PaginationFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 12px 0;
`;

export const PostHeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
`;

export const ModalIconCenter = styled.div`
  text-align: center;
  width: 100%;
`;

export const ModalErrorContainer = styled.div`
  margin-top: 12px;
`;

export const EditedLabel = styled.span`
  color: #6b6c72;
  font-size: 12px;
  margin-left: 4px;
`;

export const TimestampRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

// Attachment thumbnails shown under a post's body (single-document widgets).
export const ThumbnailsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
`;

export const ThumbnailTile = styled.div<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #d5dee3;
  background: #f4f5f8;
  display: flex;
  align-items: center;
  justify-content: center;

  & > * {
    width: 100%;
    height: 100%;
  }
`;

export const ThumbnailOverflow = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #393a3d;
`;

// Clickable attachment tile that opens the document preview modal.
export const AttachmentTile = styled.button<{ $size: number }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #d5dee3;
  background: #f4f5f8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  cursor: pointer;

  &:hover {
    background: #eceef2;
  }
`;

export const StyledListContainer = styled.div`
  border-top: 1px solid #eceef1;
`;

// ---- Post attachment uploader (smartdocs upload widget) ----

export const UploaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const UploaderError = styled.div`
  margin-top: 4px;
`;

// Uploaded-files table: "Filename (N)" + "Actions" header, then one row per
// uploaded document with a download + delete control (matches the design).
export const AttachedFilesTable = styled.div`
  border: 1px solid #d5dee3;
  border-radius: 8px;
  overflow: hidden;
`;

export const AttachedFilesHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e3e5e8;
  color: #393a3d;
`;

export const AttachedFilesHeaderName = styled.div`
  flex: 1;
`;

export const AttachedFilesHeaderActions = styled.div`
  flex-shrink: 0;
`;

export const AttachedFileRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  color: #393a3d;

  & + & {
    border-top: 1px solid #e3e5e8;
  }
`;

export const AttachedFileName = styled.div`
  flex: 1;
  word-break: break-all;
`;

export const AttachedFileActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
`;

export const FileActionButton = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: #6b6c72;
  cursor: pointer;
  display: inline-flex;
  align-items: center;

  &:hover {
    color: #393a3d;
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }
`;

// ---- Post attachment icon + popover (list-documents widget) ----

// Top-right cluster in the post header: attachment icon next to the
// three-dots action menu. Kept consistent across feed and thread.
export const PostHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

// Wraps the "View N attachment(s)" link (and its popover anchor) shown under
// the post body, above the divider. Block so it sits on its own line like the
// replies link; a small top gap separates it from the post content.
export const AttachmentLinkWrapper = styled.div`
  display: block;
  margin-top: 8px;
`;

// Popover body with the IDS card chrome stripped, so the embedded
// list-documents widget sits flush inside the popover.
export const AttachmentPopoverContent = styled(PopoverContent)`
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
`;

// Scrollable region holding the list widget; drops the widget's own card
// borders/shadows so the rows read as a flat list inside the popover.
export const AttachmentPopoverScroll = styled.div`
  max-height: 320px;
  overflow-y: auto;

  & [class*='card'],
  & [class*='Card'] {
    border: none !important;
    box-shadow: none !important;
  }
`;
