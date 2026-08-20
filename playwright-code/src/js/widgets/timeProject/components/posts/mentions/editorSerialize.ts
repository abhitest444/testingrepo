import { PostMention } from '../../../types/posts';
import { MENTION_MAX_QUERY_LENGTH } from '../../../constants';
import { buildMentionToken, parseMentionToken } from './mentionUtils';

export { buildMentionToken, parseMentionToken };

// Non-breaking space (U+00A0). contenteditable inserts these to preserve
// spacing; we normalize them to regular spaces when serializing.
const NBSP_RE = new RegExp(String.fromCharCode(160), 'g');

// Matches a trailing "@query" at the caret: an "@" preceded by start-of-string
// or whitespace, followed by up to MENTION_MAX_QUERY_LENGTH non-whitespace
// chars, anchored to the end of the inspected substring. Capture group 1 is the
// query. (Within a single text node the query is whitespace-delimited; atomic
// multi-word mentions are real badge nodes, not plain text, so they never
// participate here.)
export const MENTION_MAX_QUERY_LENGTH_RE = new RegExp(
  `(?:^|\\s)@([^\\s]{0,${MENTION_MAX_QUERY_LENGTH}})$`,
);

// data-* contract on a badge element:
//   data-mention       — marks the node as an atomic mention (presence only)
//   data-token         — the "<TYPE_ID>" saved token
//   data-name          — the resolved display name (no leading "@")

/**
 * Build the inline mention host node (imperative, because it lives inside a
 * contenteditable that React must not own). It is an atomic,
 * `contenteditable=false` span carrying the mention's data; the editor renders
 * a real IDS `<Badge>` into it via a React portal (see MentionEditor). There is
 * no close affordance — the tag is removed by Backspacing into it.
 */
export const buildBadgeElement = (
  displayName: string,
  token: string,
): HTMLElement => {
  const badge = document.createElement('span');
  badge.dataset.mention = '';
  badge.dataset.token = token;
  badge.dataset.name = displayName;
  badge.contentEditable = 'false';
  badge.className = 'ids-mention-host';
  // A fallback label so the name is visible even before the portal mounts
  // (and if it's ever serialized to HTML). The portal replaces this on render.
  badge.textContent = `@${displayName}`;
  return badge;
};

// Walk the editor's child nodes, mapping each to its contribution:
//   - text node            → its text (NBSP normalized to a normal space)
//   - mention badge        → `transform(badge)`
//   - <br>                 → "\n"
//   - other element        → recurse over its children
//
// contenteditable inserts non-breaking spaces (U+00A0) to preserve spacing —
// notably the space we add after an atomic badge node. Left as-is they save as
// "<TYPE_ID> " and render as a stray "Â" under UTF-8, so normalize them to
// regular spaces on the way out.
const walk = (root: Node, onBadge: (el: HTMLElement) => string): string => {
  let out = '';
  root.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += (node.textContent ?? '').replace(NBSP_RE, ' ');
    } else if (node instanceof HTMLElement) {
      if (node.dataset.mention !== undefined) {
        out += onBadge(node);
      } else if (node.tagName === 'BR') {
        out += '\n';
      } else {
        out += walk(node, onBadge);
      }
    }
  });
  return out;
};

// Browsers keep a trailing <br> in contenteditable as a cursor placeholder
// whenever the content ends with a line break (or the editor is empty). walk()
// emits "\n" for it, inflating the character count by 1. Strip that sentinel.
const stripTrailingBr = (s: string): string =>
  s.endsWith('\n') ? s.slice(0, -1) : s;

/** Human-readable text: badges contribute "@Name". Used for char count / dirty. */
export const domToDisplay = (root: HTMLElement): string =>
  stripTrailingBr(walk(root, (badge) => `@${badge.dataset.name ?? ''}`));

/** Save form: badges contribute their "<TYPE_ID>" token. */
export const domToSave = (root: HTMLElement): string =>
  stripTrailingBr(
    walk(
      root,
      (badge) => badge.dataset.token ?? `@${badge.dataset.name ?? ''}`,
    ),
  );

/**
 * Build a DocumentFragment for a saved post's content: "<TYPE_ID>" tokens
 * become badge nodes (resolved via `mentions`), everything else stays text.
 * Used to seed the editor in edit mode.
 */
export const hydrateToFragment = (
  content: string,
  mentions: PostMention[],
): DocumentFragment => {
  const frag = document.createDocumentFragment();
  if (!content) return frag;

  const byToken = new Map<string, string>(); // token -> displayName
  mentions.forEach((m) => {
    if (m.token && m.displayName && parseMentionToken(m.token)) {
      byToken.set(m.token, m.displayName);
    }
  });

  if (byToken.size === 0) {
    frag.appendChild(document.createTextNode(content));
    return frag;
  }

  const alt = Array.from(byToken.keys())
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const re = new RegExp(alt, 'g');

  let lastIndex = 0;
  let match = re.exec(content);
  while (match !== null) {
    if (match.index > lastIndex) {
      frag.appendChild(
        document.createTextNode(content.slice(lastIndex, match.index)),
      );
    }
    const name = byToken.get(match[0]);
    if (name) {
      frag.appendChild(buildBadgeElement(name, match[0]));
    } else {
      frag.appendChild(document.createTextNode(match[0]));
    }
    lastIndex = match.index + match[0].length;
    match = re.exec(content);
  }
  if (lastIndex < content.length) {
    frag.appendChild(document.createTextNode(content.slice(lastIndex)));
  }
  return frag;
};
