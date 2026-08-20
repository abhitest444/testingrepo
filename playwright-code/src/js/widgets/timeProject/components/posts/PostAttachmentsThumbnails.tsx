import React, { useCallback, useMemo, useRef, useState } from 'react';
import HOCWidget from 'web-shell-core/widgets/HOCWidget';
import { Popover, PopoverContent, PopoverHeader } from '@ids-ts/popover';
import { B3 } from '@ids-ts/typography';
import { useIntl, useSandbox } from '@payroll/quicksand';
import { getAppSecret } from 'src/js/service/ApolloClientBuilderUtils';
import { Post } from '../../types/posts';
import { OFFERING_ID, ASSET_ID, RESOURCE_ID } from './postAttachmentConstants';
import {
  AttachmentLinkWrapper,
  PostRepliesLink,
  AttachmentPopoverContent,
  AttachmentPopoverScroll,
} from './PostsFeed.styled';

interface PostAttachmentsThumbnailsProps {
  post: Post;
}

/** Whether a post has at least one attachment with a usable document id. */
export const postHasAttachments = (post: Post): boolean =>
  (post.attachments ?? []).some((a) => !!a.documentId);

/**
 * Post attachment entry point. Renders a "View N attachment(s)" link (styled
 * like the "N replies" link) under the post body; clicking it opens a popover
 * anchored to the link that loads the smartdocs `list-documents` widget scoped
 * to this post's attachment document ids (`offeringFilters.documentIds`).
 * Read-only — no per-row file actions — and clicking a row opens the embedded
 * in-panel preview (`docPreviewProps`).
 */
const PostAttachmentsThumbnails: React.FC<PostAttachmentsThumbnailsProps> = ({
  post,
}) => {
  const intl = useIntl();
  const sandbox = useSandbox();
  const text = useCallback(
    (id: string, values?: Record<string, any>) =>
      intl.formatMessage({ id }, values),
    [intl],
  );

  const [isOpen, setIsOpen] = useState(false);
  // The popover anchors to the link button element.
  const linkRef = useRef<HTMLButtonElement | null>(null);

  // Each post supplies its own attachment document ids.
  const documentIds = useMemo(
    () =>
      (post.attachments ?? [])
        .map((a) => a.documentId)
        .filter((id): id is string => !!id),
    [post.attachments],
  );

  // configProps for the list-documents widget (uppercase keys).
  const configProps = useMemo(
    () => ({
      API_KEY: getAppSecret(sandbox),
      OFFERING_ID,
      ASSET_ID,
      is7216: false,
    }),
    [sandbox],
  );

  const offeringFilters = useMemo(() => ({ documentIds }), [documentIds]);

  // Authorization scope for reading the post's documents — mirrors what the
  // uploader passed when creating them. The viewing worker is the post's
  // author (the post is self-contained: projectId + author id/type).
  const authorizationAttributes = useMemo(
    () => ({
      resourceId: RESOURCE_ID,
      resourceAttributes: [
        { name: 'projectId', value: post.projectId ?? '' },
        { name: 'workerId', value: post.author?.id ?? '' },
        { name: 'workerType', value: post.author?.type ?? '' },
      ],
    }),
    [post.projectId, post.author?.id, post.author?.type],
  );

  // Keep icon / popover interactions from bubbling up to the card's
  // open-thread handler.
  const stopPropagation = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((open) => !open);
  }, []);

  const handleClose = useCallback(() => setIsOpen(false), []);

  // No attachment data on the post → render nothing (no link).
  if (documentIds.length === 0) return null;

  const attachmentCount = documentIds.length;
  // "View 1 attachment" / "View N attachments" — matches the replies-link style.
  const linkLabel = text('timeProject.posts.attachments.viewLabel', {
    count: attachmentCount,
  });

  return (
    <AttachmentLinkWrapper
      onClick={stopPropagation}
      data-testid={`post-attachments-${post.id}`}
    >
      <PostRepliesLink
        ref={linkRef}
        type="button"
        $clickable
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={handleToggle}
        data-testid={`post-attachments-link-${post.id}`}
      >
        <B3 weight="demi">{linkLabel}</B3>
      </PostRepliesLink>

      {isOpen && linkRef.current && (
        <Popover
          dismissible
          enableClickAway
          open={isOpen}
          onClose={handleClose}
          targetElement={linkRef.current}
          position="bottom"
          alignment="left"
          popoverOffsetSkidding={75}
          animationOn
          onPosition={() => {}}
          popoverOffsetDistance={0}
          suppressPointer
          unmountDelay={500}
          variant="popover"
        >
          <PopoverHeader
            title={text('timeProject.posts.attachments.popoverTitle')}
            alignment="left"
          />
          <AttachmentPopoverContent>
            <AttachmentPopoverScroll
              data-testid={`post-attachments-list-${post.id}`}
            >
              <HOCWidget
                widgetId="smartdocs-web-platform/list-documents"
                sandbox={sandbox}
                configProps={configProps}
                // Read-only: filename + thumbnail only, no actions column.
                columns={['document']}
                offeringFilters={offeringFilters}
                enableDocPreview
                enableModalView
                modalViewActions={[{ id: 'download' }]}
                pageSize={8}
                // No empty-state UI.
                enableZeroState={false}
                // Suppress the widget's built-in error card when a load fails.
                hideCardsOnLoadAndError={{
                  hideOnLoad: true,
                  hideOnError: true,
                }}
                authorizationAttributes={authorizationAttributes}
              />
            </AttachmentPopoverScroll>
          </AttachmentPopoverContent>
        </Popover>
      )}
    </AttachmentLinkWrapper>
  );
};

export default PostAttachmentsThumbnails;
