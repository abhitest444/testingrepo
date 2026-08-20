import { PostMention } from '../../../types/posts';

/** Build the backend token for a worker id + type, e.g. "<EMPLOYEE_6>". */
export const buildMentionToken = (type: string, workerId: string): string =>
  `<${type}_${workerId}>`;

// Parses "<EMPLOYEE_6>" into its type ("EMPLOYEE") and id ("6"). The id is the
// trailing segment after the final underscore so multi-word types like
// LEGACY_QBO_USER round-trip correctly.
const TOKEN_RE = /^<([A-Z_]+)_([^_<>]+)>$/;

export const parseMentionToken = (
  token: string,
): { type: string; workerId: string } | null => {
  const match = TOKEN_RE.exec(token);
  if (!match) return null;
  return { type: match[1], workerId: match[2] };
};

/**
 * Resolve a saved post's content (with "<TYPE_ID>" mention tokens) to the
 * human-readable "@Name" display string, using the feed's `PostMention[]`
 * token→name map. Used purely as the dirty-detection baseline for the editor
 * (the editor builds its own DOM/badges from the same content + mentions). Each
 * resolvable token becomes "@displayName"; unknown tokens are left as-is.
 */
export const hydrateMentions = (
  content: string,
  mentions: PostMention[],
): { text: string } => {
  if (!content || !mentions?.length) return { text: content };

  const text = mentions.reduce((acc, mention) => {
    if (!mention.token || !mention.displayName) return acc;
    if (!parseMentionToken(mention.token)) return acc;
    const escaped = mention.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return acc.replace(new RegExp(escaped, 'g'), `@${mention.displayName}`);
  }, content);

  return { text };
};
