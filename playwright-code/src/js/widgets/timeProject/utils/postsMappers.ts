import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { mapQBTimezoneToDayjsTimezone } from 'src/js/common/DateAndTimeUtils';
import { Post, PostMention, PostNodeGQL } from '../types/posts';

dayjs.extend(utc);
dayjs.extend(timezone);

// Map a raw timeTrackingPosts node to the UI Post domain model.
export const mapPostNode = (node: PostNodeGQL): Post => ({
  id: node.id,
  parentPostId: node.parentPostId,
  projectId: node.projectId,
  customerId: node.customerId,
  author: node.worker ?? { id: '' },
  content: node.content ?? '',
  replyCount: node.replyCount ?? 0,
  unreadReplyCount: node.unreadReplyCount ?? 0,
  attachments: (node.contentAttachments ?? []).map((a) => ({
    id: a.id,
    documentId: a.documentId,
    fileName: a.fileName,
    orientationDegree: a.orientationDegree,
    createdAt: a.meta?.createdAt,
    createdBy: a.meta?.createdBy,
  })),
  mentions: node.postMentions ?? [],
  createdAt: node.postMeta.createdAt,
  updatedAt: node.postMeta.updatedAt,
});

// Replace mention tokens (e.g. "<EMPLOYEE_6>") in the raw content with the
// resolved worker display name from `postMentions`. Falls back to the raw
// content when there are no mentions to resolve.
export const renderPostContent = (
  content: string,
  mentions: PostMention[],
): string => {
  if (!content || !mentions?.length) return content;
  return mentions.reduce((acc, mention) => {
    if (!mention.token) return acc;
    const label = mention.displayName?.trim() || mention.token;
    // Tokens are literal substrings of the content — replace every
    // occurrence. Escape regex-special chars in the token (it's wrapped in
    // angle brackets and underscores, but be defensive).
    const escaped = mention.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return acc.replace(new RegExp(escaped, 'g'), label);
  }, content);
};

export interface PostContentSegment {
  type: 'text' | 'mention' | 'link';
  /** Resolved display text (mention name / link text / raw text). */
  value: string;
  /** Stable key for the mention (workerId) — used for the React key. */
  workerId?: string;
  /** Href for link segments (the matched http/https URL). */
  href?: string;
}

// http/https URL matcher. Stops at whitespace; trims trailing punctuation
// that commonly abuts a URL in prose (e.g. "see https://x.com." -> the
// trailing "." is not part of the link).
const URL_REGEX = /https?:\/\/[^\s]+/gi;
const TRAILING_PUNCT = /[.,!?;:)\]]+$/;

// Split raw content into ordered text / mention / link segments so the UI
// can highlight @-mentions (e.g. "<EMPLOYEE_6>" -> the worker's name in
// blue) and render http(s) URLs as clickable links. Falls back to a single
// text segment when there's nothing to highlight.
export const parsePostContent = (
  content: string,
  mentions: PostMention[],
): PostContentSegment[] => {
  if (!content) return [];

  const tokenMentions = (mentions ?? []).filter((m) => m.token);
  const byToken = new Map(tokenMentions.map((m) => [m.token, m]));

  // Combined alternation: mention tokens first (so a token never gets
  // partially swallowed by the URL matcher), then URLs.
  const parts: string[] = [];
  if (tokenMentions.length) {
    parts.push(
      ...tokenMentions.map((m) =>
        m.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      ),
    );
  }
  parts.push(URL_REGEX.source);

  // Nothing to highlight -> single text segment.
  if (!tokenMentions.length && !URL_REGEX.test(content)) {
    URL_REGEX.lastIndex = 0;
    return [{ type: 'text', value: content }];
  }
  URL_REGEX.lastIndex = 0;

  const re = new RegExp(`(${parts.join('|')})`, 'gi');
  const segments: PostContentSegment[] = [];
  let lastIndex = 0;
  let match = re.exec(content);
  while (match !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: content.slice(lastIndex, match.index),
      });
    }
    const matched = match[0];
    const mention = byToken.get(matched);
    if (mention) {
      segments.push({
        type: 'mention',
        value: mention.displayName?.trim() || matched,
        workerId: mention.workerId,
      });
      lastIndex = match.index + matched.length;
    } else {
      // URL — strip trailing punctuation back into a following text segment.
      const trailing = TRAILING_PUNCT.exec(matched)?.[0] ?? '';
      const href = trailing
        ? matched.slice(0, matched.length - trailing.length)
        : matched;
      segments.push({ type: 'link', value: href, href });
      if (trailing) segments.push({ type: 'text', value: trailing });
      lastIndex = match.index + matched.length;
    }
    match = re.exec(content);
  }
  if (lastIndex < content.length) {
    segments.push({ type: 'text', value: content.slice(lastIndex) });
  }
  return segments;
};

// Author avatar initials from the worker name (e.g. "test admin admin" ->
// "TA"). Falls back to a single char or "?".
export const getAuthorInitials = (
  displayName?: string | null,
  firstName?: string | null,
  lastName?: string | null,
): string => {
  const name = (displayName || `${firstName ?? ''} ${lastName ?? ''}`).trim();
  if (!name) return '?';
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(
    0,
  )}`.toUpperCase();
};

// Format a post timestamp to a time-only / relative-day label in the
// company timezone, e.g. "Today, 3:02pm" / "Jun 14, 9:41am".
export const formatPostTimestamp = (
  isoTimestamp: string,
  qbTimezone?: string,
): string => {
  if (!isoTimestamp) return '';
  // Only map/apply a timezone when the company timezone is actually known.
  // `mapQBTimezoneToDayjsTimezone('')` defaults to Pacific, so calling it
  // for an empty/unknown timezone would silently render Pacific instead of
  // local — mirror the codebase's `applyTimezoneToDayjs` behaviour of not
  // applying a tz when it's falsy.
  const tz = qbTimezone ? mapQBTimezoneToDayjsTimezone(qbTimezone) : null;
  const when = tz ? dayjs(isoTimestamp).tz(tz) : dayjs(isoTimestamp);
  if (!when.isValid()) return '';
  const now = tz ? dayjs().tz(tz) : dayjs();
  const timePart = when.format('h:mma');
  if (when.isSame(now, 'day')) return `Today, ${timePart}`;
  if (when.isSame(now.subtract(1, 'day'), 'day')) {
    return `Yesterday, ${timePart}`;
  }
  return `${when.format('MMM D')}, ${timePart}`;
};
