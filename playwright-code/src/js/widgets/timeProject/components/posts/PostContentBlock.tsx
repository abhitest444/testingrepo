import React, { useCallback, useMemo, useState } from 'react';
import { B2, B3 } from '@ids-ts/typography';
import Badge from '@ids-ts/badge';
import { IconControl } from '@ids-ts/icon-control';
import { Menu, MenuItem } from '@ids-ts/menu';
import { OverflowWeb } from '@design-systems/icons';
import { useIntl } from '@payroll/quicksand';
import { useHasAdminAccess } from 'src/js/service/utils/sandboxUtils';
import { Post } from '../../types/posts';
import {
  formatPostTimestamp,
  getAuthorInitials,
  parsePostContent,
} from '../../utils/postsMappers';
import {
  PostAuthorRow,
  Avatar,
  AuthorMeta,
  AuthorName,
  PostTimestamp,
  PostBody,
  Mention,
  PostLink,
  PostHeaderRow,
  PostHeaderActions,
  EditedLabel,
  TimestampRow,
} from './PostsFeed.styled';

interface PostContentBlockProps {
  post: Post;
  qbTimezone?: string;
  /** Render full content (no 2-line clamp). Replies / thread parent use this. */
  fullContent?: boolean;
  /** Smaller avatar — used for reply rows. */
  compact?: boolean;
  /** Show the action menu (edit / delete). Feed view only. */
  showActions?: boolean;
  /** Whether the current user is the post author (controls edit visibility). */
  isAuthor?: boolean;
  onEdit?: () => void;
  /** Show delete in the action menu (posts with no replies only). */
  canDelete?: boolean;
  onDelete?: () => void;
  /** Hide the post body — used when inline editing replaces the body. */
  hideBody?: boolean;
  /**
   * Content rendered in the header's top-right cluster, alongside the action
   * (three-dots) menu — e.g. the attachment icon. Shown for the parent post in
   * both feed and thread, not for reply rows.
   */
  headerAction?: React.ReactNode;
}

/**
 * Shared author row (avatar + name + timestamp) and post body (with mentions
 * highlighted and http(s) links). Used for the feed card, the thread parent,
 * and each reply row so they all render in the exact same format.
 */
const PostContentBlock: React.FC<PostContentBlockProps> = ({
  post,
  qbTimezone,
  fullContent = false,
  compact = false,
  showActions = false,
  isAuthor = false,
  onEdit,
  canDelete = false,
  onDelete,
  hideBody = false,
  headerAction,
}) => {
  const intl = useIntl();
  const text = useCallback((id: string) => intl.formatMessage({ id }), [intl]);
  const isAdmin = !!useHasAdminAccess();

  const [menuOpen, setMenuOpen] = useState(false);

  const initials = getAuthorInitials(
    post.author.displayName,
    post.author.firstName,
    post.author.lastName,
  );

  const isEdited = post.createdAt !== post.updatedAt;

  const timestamp = useMemo(
    () => formatPostTimestamp(post.updatedAt, qbTimezone),
    [post.updatedAt, qbTimezone],
  );
  const contentSegments = useMemo(
    () => parsePostContent(post.content, post.mentions),
    [post.content, post.mentions],
  );

  const handleMenuClose = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const handleMenuToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  }, []);

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setMenuOpen(false);
      onEdit?.();
    },
    [onEdit],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setMenuOpen(false);
      onDelete?.();
    },
    [onDelete],
  );

  const showEditAction = isAuthor;
  const showDeleteAction = canDelete && (isAuthor || isAdmin);
  const showActionMenu = showActions && (showEditAction || showDeleteAction);

  const authorRow = (
    <PostAuthorRow>
      <Avatar $compact={compact} aria-hidden="true">
        {initials}
      </Avatar>
      <AuthorMeta>
        <AuthorName>
          <B2 weight="demi">{post.author.displayName || '—'}</B2>
        </AuthorName>
        <TimestampRow>
          <PostTimestamp>
            <B3>{timestamp}</B3>
          </PostTimestamp>
          {isEdited && (
            <EditedLabel data-testid={`post-edited-${post.id}`}>
              <B3>{text('timeProject.posts.editedLabel')}</B3>
            </EditedLabel>
          )}
        </TimestampRow>
      </AuthorMeta>
    </PostAuthorRow>
  );

  const actionMenu = showActionMenu ? (
    <Menu
      open={menuOpen}
      onClose={handleMenuClose}
      onClickAway={handleMenuClose}
      position="bottom"
      alignment="right"
      minWidth={75}
      menuOffsetSkidding={-10}
      anchorElement={
        <IconControl
          onClick={handleMenuToggle}
          aria-label={text('timeProject.posts.actionsLabel')}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          size="medium"
          data-testid={`post-actions-${post.id}`}
        >
          <OverflowWeb />
        </IconControl>
      }
    >
      {[
        ...(showEditAction
          ? [
              <MenuItem
                key="edit"
                value="edit"
                size="medium"
                onClick={handleEdit}
                data-testid={`post-action-edit-${post.id}`}
              >
                {text('timeProject.posts.edit')}
              </MenuItem>,
            ]
          : []),
        ...(showDeleteAction
          ? [
              <MenuItem
                key="delete"
                value="delete"
                size="medium"
                onClick={handleDelete}
                data-testid={`post-action-delete-${post.id}`}
              >
                {text('timeProject.posts.delete')}
              </MenuItem>,
            ]
          : []),
      ]}
    </Menu>
  ) : null;

  // Top-right cluster: attachment icon (headerAction) beside the action menu.
  const headerCluster =
    headerAction || actionMenu ? (
      <PostHeaderActions>
        {headerAction}
        {actionMenu}
      </PostHeaderActions>
    ) : null;

  return (
    <>
      {headerCluster ? (
        <PostHeaderRow>
          {authorRow}
          {headerCluster}
        </PostHeaderRow>
      ) : (
        authorRow
      )}
      {!hideBody && (
        <PostBody
          $noClamp={fullContent}
          $compact={compact}
          data-testid={`post-content-${post.id}`}
        >
          <B3 weight="medium">
            {contentSegments.map((seg, i) => {
              if (seg.type === 'mention') {
                return (
                  <Mention
                    // eslint-disable-next-line react/no-array-index-key
                    key={`m-${i}-${seg.workerId ?? ''}`}
                    data-testid="post-mention"
                  >
                    <Badge
                      status="info"
                      priority="secondary"
                      capitalization="sentence"
                    >
                      {seg.value}
                    </Badge>
                  </Mention>
                );
              }
              if (seg.type === 'link') {
                return (
                  <PostLink
                    // eslint-disable-next-line react/no-array-index-key
                    key={`l-${i}`}
                    href={seg.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    data-testid="post-link"
                  >
                    {seg.value}
                  </PostLink>
                );
              }
              return (
                // eslint-disable-next-line react/no-array-index-key
                <React.Fragment key={`t-${i}`}>{seg.value}</React.Fragment>
              );
            })}
          </B3>
        </PostBody>
      )}
    </>
  );
};

export default PostContentBlock;
