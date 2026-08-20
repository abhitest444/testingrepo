import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import TextArea from '@ids-ts/textarea';
import Badge from '@ids-ts/badge';
import { TimeForAssignment } from 'src/js/service/types/assignmentTypes';
import { PostMention } from '../../../types/posts';
import { useMentionSearch } from './useMentionSearch';
import MentionMenu from './MentionMenu';
import {
  buildMentionToken,
  MENTION_MAX_QUERY_LENGTH_RE,
  domToDisplay,
  domToSave,
  buildBadgeElement,
  hydrateToFragment,
} from './editorSerialize';
import { wouldExceedMaxLength, clampPasteText } from './mentionEditorLimits';
import {
  EditorShell,
  Editable,
  ValidationMessage,
} from './MentionEditor.styled';

export interface MentionEditorProps {
  /** Saved post content ("<TYPE_ID>" tokens) to seed in edit mode. */
  initialContent?: string;
  /** Resolved mentions for the saved content (token → name). */
  initialMentions?: PostMention[];
  placeholder?: string;
  disabled?: boolean;
  errorText?: string;
  /**
   * Hard cap on display-text length, enforced like a native
   * `<textarea maxlength>` — typing and pasting beyond it is blocked rather
   * than just flagged after the fact. Omit to leave the editor unbounded.
   */
  maxLength?: number;
  width?: string;
  projectId?: string;
  customerId?: string;
  'data-testid'?: string;
  /** Fired with the human-readable display text on every edit (for char count / dirty). */
  onChange?: (displayText: string) => void;
}

export interface MentionEditorHandle {
  /** The save form: display text with "@Name" replaced by "<TYPE_ID>" tokens. */
  getSaveContent: () => string;
  /** Current human-readable display text. */
  getDisplayContent: () => string;
  focus: () => void;
  /** Empty the editor (e.g. after a reply is posted). */
  clear: () => void;
}

// Hidden real IDS TextArea used purely to (a) render the design-system chrome
// (label/border/error/focus/disabled) and (b) hand us the exact input
// className to mirror onto the contenteditable.

/**
 * A rich post editor that renders @-mentions as inline IDS-styled badges while
 * looking and behaving like the IDS `TextArea`. The visible editing surface is
 * a `contenteditable` div that wears the real IDS textarea input className (so
 * white/error backgrounds, focus ring and borders come from the design system).
 * A real (visually hidden) IDS `TextArea` is rendered alongside purely as the
 * live source of that className; the validation/error message is rendered
 * visibly below. Mentions are atomic (`contenteditable=false`) badge nodes;
 * Backspacing into one removes it and reopens the search. Tokens are produced
 * by walking the DOM at save time.
 */
const MentionEditor = forwardRef<MentionEditorHandle, MentionEditorProps>(
  (
    {
      initialContent,
      initialMentions,
      placeholder,
      disabled,
      errorText,
      maxLength,
      width = '100%',
      projectId,
      customerId,
      onChange,
      'data-testid': dataTestId,
    },
    ref,
  ) => {
    const editableRef = useRef<HTMLDivElement>(null);
    const hiddenTaWrapRef = useRef<HTMLDivElement>(null);
    const { workers, loading, search, cancel } = useMentionSearch(
      projectId,
      customerId,
    );

    const [menuOpen, setMenuOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [highlightIndex, setHighlightIndex] = useState(0);
    const [menuPos, setMenuPos] = useState({ left: 0, top: 0 });
    // The mention host nodes currently in the editor; each gets a real IDS
    // <Badge> rendered into it via a portal. Recomputed after any DOM change.
    const [badgeHosts, setBadgeHosts] = useState<HTMLElement[]>([]);
    // The text range [start,end) the @query occupies, captured as DOM offsets
    // via a stored Range so we can replace it with a badge on select.
    const triggerRangeRef = useRef<Range | null>(null);

    // Monotonic id stamped on each host so portal keys are unique even when the
    // same worker is tagged twice (duplicate tokens).
    const bidRef = useRef(0);

    // Re-scan the editor for mention host nodes and update the portal targets.
    // Each host's fallback text is cleared (once) so the portal owns its
    // content, and gets a stable unique id for the React key.
    const refreshBadges = useCallback(() => {
      const editable = editableRef.current;
      if (!editable) return;
      const hosts = Array.from(
        editable.querySelectorAll<HTMLElement>('[data-mention]'),
      );
      hosts.forEach((h) => {
        if (!h.dataset.portalMounted) {
          h.textContent = '';
          h.dataset.portalMounted = '1';
          bidRef.current += 1;
          h.dataset.bid = String(bidRef.current);
        }
      });
      setBadgeHosts((prev) =>
        prev.length === hosts.length && prev.every((h, i) => h === hosts[i])
          ? prev
          : hosts,
      );
    }, []);

    const emitChange = useCallback(() => {
      if (!editableRef.current || !onChange) return;
      refreshBadges();
      onChange(domToDisplay(editableRef.current));
    }, [onChange, refreshBadges]);

    // --- IDS style mirroring -------------------------------------------------
    // Apply the real textarea input's LIVE className to the contenteditable so
    // every design-system state — white background, error background
    // (#d52b1e1a), focus ring, borders — comes straight from IDS's own CSS
    // rules (NOT flattened computed styles, which can't reproduce :focus / error
    // variants). Re-runs when `errorText`/`disabled` change so the error class
    // (TextArea-ta-enabled-errors-*) is picked up. The styled `Editable` class
    // is preserved first and supplies our height/box overrides via `!important`.
    useLayoutEffect(() => {
      const wrap = hiddenTaWrapRef.current;
      const editable = editableRef.current;
      if (!wrap || !editable) return;
      const realInput = wrap.querySelector('textarea');
      if (!realInput) return;
      if (!editable.dataset.baseClass) {
        editable.dataset.baseClass = editable.className;
      }
      editable.className =
        `${editable.dataset.baseClass} ${realInput.className}`.trim();
    }, [width, disabled, errorText]);

    // --- Initial hydration (edit mode) --------------------------------------
    useLayoutEffect(() => {
      const editable = editableRef.current;
      if (!editable) return;
      editable.innerHTML = '';
      if (initialContent) {
        const frag = hydrateToFragment(initialContent, initialMentions ?? []);
        editable.appendChild(frag);
      }
      emitChange();
      // Only on mount / when the seed target changes.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialContent, initialMentions]);

    // --- Mention search trigger ---------------------------------------------
    const closeMenu = useCallback(() => {
      setMenuOpen(false);
      triggerRangeRef.current = null;
      cancel();
    }, [cancel]);

    // Inspect the caret; if it sits in an "@query" run of plain text, open the
    // menu anchored at the caret and (debounced) search. Otherwise close.
    const syncTrigger = useCallback(() => {
      const editable = editableRef.current;
      if (!editable || disabled) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) {
        closeMenu();
        return;
      }
      const range = sel.getRangeAt(0);
      const node = range.startContainer;
      // Only trigger inside a text node (never inside a badge or at element).
      if (node.nodeType !== Node.TEXT_NODE) {
        closeMenu();
        return;
      }
      const textToCaret = (node.textContent ?? '').slice(0, range.startOffset);
      const match = MENTION_MAX_QUERY_LENGTH_RE.exec(textToCaret);
      if (!match) {
        closeMenu();
        return;
      }
      const q = match[1];

      // Build a range that covers "@query" so we can replace it on select.
      const atStart = range.startOffset - q.length - 1;
      const tr = document.createRange();
      tr.setStart(node, atStart);
      tr.setEnd(node, range.startOffset);
      triggerRangeRef.current = tr;

      // Anchor the menu at the caret rect.
      const rect = range.getClientRects()[0] ?? tr.getBoundingClientRect();
      const shellRect = editable.getBoundingClientRect();
      setMenuPos({
        left: rect.left - shellRect.left,
        top: rect.bottom - shellRect.top,
      });

      setQuery((prev) => {
        // Only reset the highlight when the query actually changes (a new
        // search). Re-syncing the SAME open query (e.g. an arrow keyup) must
        // NOT stomp the user's keyboard selection — that caused the flicker.
        if (prev !== q) setHighlightIndex(0);
        return q;
      });
      setMenuOpen(true);
      search(q);
    }, [disabled, closeMenu, search]);

    // Hard cap enforcement, fallback path: `beforeinput`.preventDefault()
    // (below) is the fast/no-flicker path, but its `inputType`/preventability
    // is inconsistent across browsers and React's synthetic event handling
    // for contenteditable — so this is the mechanism we actually rely on.
    // `input` fires reliably after ANY DOM mutation (typing, IME, drag,
    // undo/redo, ...), so trimming here on every change is a guaranteed
    // backstop: if a change ever pushes the display text past `maxLength`,
    // remove exactly the overflow immediately, walking backward from the
    // caret through plain text only — atomic mention badges are never
    // partially deleted, so any excess that can't be safely removed this
    // way is simply left (an extremely rare edge case).
    const trimOverflow = useCallback(() => {
      const editable = editableRef.current;
      if (maxLength == null || !editable) return;

      let excess = domToDisplay(editable).length - maxLength;
      if (excess <= 0) return;

      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      let node: Node = range.startContainer;
      let offset = range.startOffset;
      if (node.nodeType !== Node.TEXT_NODE) return;

      while (excess > 0) {
        const text = node.textContent ?? '';
        const removable = Math.min(offset, excess);
        if (removable > 0) {
          node.textContent =
            text.slice(0, offset - removable) + text.slice(offset);
          offset -= removable;
          excess -= removable;
        }
        if (excess <= 0) break;

        // Move to the previous text node, stopping at a mention badge (or
        // the editor boundary) rather than reaching into/through one.
        let prev: Node | null = node.previousSibling;
        let walkUp = node;
        while (!prev && walkUp.parentNode && walkUp.parentNode !== editable) {
          walkUp = walkUp.parentNode;
          prev = walkUp.previousSibling;
        }
        if (!prev || prev.nodeType !== Node.TEXT_NODE) break;
        node = prev;
        offset = (node.textContent ?? '').length;
      }

      const r = document.createRange();
      r.setStart(node, Math.max(0, offset));
      r.collapse(true);
      sel.removeAllRanges();
      sel.addRange(r);
    }, [maxLength]);

    const onInput = useCallback(
      (e: React.FormEvent<HTMLDivElement>) => {
        // Don't trim mid-IME-composition — wait for compositionend so we
        // don't yank text out from under an open composition candidate.
        if (!(e.nativeEvent as InputEvent).isComposing) trimOverflow();
        emitChange();
        syncTrigger();
      },
      [emitChange, syncTrigger, trimOverflow],
    );

    const onCompositionEnd = useCallback(() => {
      trimOverflow();
      emitChange();
      syncTrigger();
    }, [trimOverflow, emitChange, syncTrigger]);

    // Hard cap enforcement, fast path: blocks the character/paragraph
    // before the browser even inserts it, avoiding the (harmless but
    // visible) flash-then-trim of the `input` fallback above. Replacing a
    // selection is still allowed as long as the net result fits.
    const onBeforeInput = useCallback(
      (e: React.FormEvent<HTMLDivElement>) => {
        if (maxLength == null || !editableRef.current) return;
        const nativeEvent = e.nativeEvent as InputEvent;
        const insertingTypes = new Set([
          'insertText',
          'insertCompositionText',
          'insertReplacementText',
          'insertLineBreak',
          'insertParagraph',
        ]);
        if (!insertingTypes.has(nativeEvent.inputType)) return;

        const insertedLength = nativeEvent.data?.length ?? 1;
        const sel = window.getSelection();
        const selectedLength =
          sel && !sel.isCollapsed ? sel.toString().length : 0;
        const currentLength = domToDisplay(editableRef.current).length;

        if (
          wouldExceedMaxLength({
            currentLength,
            selectedLength,
            insertedLength,
            maxLength,
          })
        ) {
          e.preventDefault();
        }
      },
      [maxLength],
    );

    // --- Insert a badge for the chosen worker -------------------------------
    const insertMention = useCallback(
      (worker: TimeForAssignment) => {
        const editable = editableRef.current;
        const tr = triggerRangeRef.current;
        if (!editable || !tr) return;
        const displayName =
          worker.displayName?.trim() ||
          worker.fullName?.trim() ||
          worker.timeForContactDAS.id;
        const type = worker.timeForType ?? 'EMPLOYEE';
        const token = buildMentionToken(type, worker.timeForContactDAS.id);

        // Same hard cap as typing/pasting: replacing "@query" with the
        // "@Name " badge must not push the display text past maxLength.
        if (maxLength != null) {
          const currentLength = domToDisplay(editable).length;
          const selectedLength = tr.toString().length;
          const insertedLength = displayName.length + 2; // "@Name" + trailing space
          if (
            wouldExceedMaxLength({
              currentLength,
              selectedLength,
              insertedLength,
              maxLength,
            })
          ) {
            closeMenu();
            return;
          }
        }

        const badge = buildBadgeElement(displayName, token);

        // Replace the "@query" range with the badge + a trailing space, then
        // place the caret after the space.
        tr.deleteContents();
        const space = document.createTextNode(String.fromCharCode(32));
        tr.insertNode(space);
        tr.insertNode(badge);

        const sel = window.getSelection();
        const after = document.createRange();
        after.setStartAfter(space);
        after.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(after);

        closeMenu();
        emitChange();
        editable.focus();
      },
      [closeMenu, emitChange, maxLength],
    );

    // --- Keyboard: menu nav + atomic badge backspace ------------------------
    const reopenSearchFromBadge = useCallback(
      (badge: HTMLElement) => {
        // Replace the badge with its "@name" text (minus last char) so the user
        // resumes editing the query, then reopen the menu.
        const name = badge.dataset.name ?? '';
        const seed = `@${name.slice(0, -1)}`;
        const textNode = document.createTextNode(seed);
        badge.replaceWith(textNode);
        const sel = window.getSelection();
        const r = document.createRange();
        r.setStart(textNode, seed.length);
        r.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(r);
        emitChange();
        syncTrigger();
      },
      [emitChange, syncTrigger],
    );

    const onKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (menuOpen) {
          const count = workers.length;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (count) setHighlightIndex((i) => (i + 1) % count);
            return;
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (count) setHighlightIndex((i) => (i - 1 + count) % count);
            return;
          }
          if (e.key === 'Enter' || e.key === 'Tab') {
            if (count) {
              e.preventDefault();
              insertMention(workers[highlightIndex] ?? workers[0]);
              return;
            }
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            closeMenu();
            return;
          }
        }

        if (e.key === 'Enter') {
          e.preventDefault();
          document.execCommand('insertLineBreak');
          emitChange();
        }

        if (e.key === 'Backspace') {
          const sel = window.getSelection();
          if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return;
          const range = sel.getRangeAt(0);
          // If the node immediately before the caret is a badge, remove it +
          // reopen search instead of deleting one char.
          let badge: HTMLElement | null = null;
          const { startContainer, startOffset } = range;
          if (
            startContainer.nodeType === Node.ELEMENT_NODE &&
            startOffset > 0
          ) {
            const prev = startContainer.childNodes[startOffset - 1];
            if (prev instanceof HTMLElement && prev.dataset.mention) {
              badge = prev;
            }
          } else if (
            startContainer.nodeType === Node.TEXT_NODE &&
            startOffset === 0
          ) {
            const prev = (startContainer as Text).previousSibling;
            if (prev instanceof HTMLElement && prev.dataset.mention) {
              badge = prev;
            }
          }
          if (badge) {
            e.preventDefault();
            reopenSearchFromBadge(badge);
          }
        }
      },
      [
        menuOpen,
        workers,
        highlightIndex,
        insertMention,
        closeMenu,
        reopenSearchFromBadge,
        emitChange,
      ],
    );

    // Clicking re-syncs the trigger from the new caret position. (Badges carry
    // no close affordance; removal is via Backspace.)
    const onClick = useCallback(() => syncTrigger(), [syncTrigger]);

    // Re-sync the trigger on keyup for caret moves that don't change the text
    // (e.g. Left/Right/Home). Skip the menu-navigation keys while the menu is
    // open — they're owned by onKeyDown, and re-syncing on their keyup would
    // reset the highlighted item (the down-arrow flicker).
    const onKeyUp = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (
          menuOpen &&
          ['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(e.key)
        ) {
          return;
        }
        syncTrigger();
      },
      [menuOpen, syncTrigger],
    );

    // Paste as plain text so markup never enters the editor. Truncates to
    // whatever room remains under `maxLength` (dropping the paste entirely
    // if already at the cap) instead of just letting it through.
    const onPaste = useCallback(
      (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        const editable = editableRef.current;
        if (maxLength == null || !editable) {
          document.execCommand('insertText', false, text);
          return;
        }
        const sel = window.getSelection();
        const selectedLength =
          sel && !sel.isCollapsed ? sel.toString().length : 0;
        const currentLength = domToDisplay(editable).length;
        const clamped = clampPasteText(text, {
          currentLength,
          selectedLength,
          maxLength,
        });
        if (clamped) document.execCommand('insertText', false, clamped);
      },
      [maxLength],
    );

    useImperativeHandle(
      ref,
      () => ({
        getSaveContent: () =>
          editableRef.current ? domToSave(editableRef.current) : '',
        getDisplayContent: () =>
          editableRef.current ? domToDisplay(editableRef.current) : '',
        focus: () => editableRef.current?.focus(),
        clear: () => {
          if (editableRef.current) editableRef.current.innerHTML = '';
          emitChange();
        },
      }),
      [emitChange],
    );

    const anchor = useMemo(
      () => (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: menuPos.left,
            top: menuPos.top,
            width: 0,
            height: 0,
          }}
        />
      ),
      [menuPos.left, menuPos.top],
    );

    useEffect(() => {
      if (disabled && menuOpen) closeMenu();
    }, [disabled, menuOpen, closeMenu]);

    return (
      <EditorShell>
        {/* Real IDS TextArea, visually hidden: supplies chrome + style source. */}
        <div
          ref={hiddenTaWrapRef}
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            // Keep the wrapper laid out (so the textarea exists to read styles)
            // but invisible — the contenteditable is the visible field.
            opacity: 0,
          }}
        >
          {/* NOTE: no `readOnly` — it makes IDS add the read-only class
              (grey background) which we copy onto the editable. This textarea
              is hidden and never typed into, so it isn't needed. */}
          <TextArea
            value=""
            onChange={() => {}}
            width={width}
            errorText={errorText}
            disabled={disabled}
            aria-label="Post content"
          />
        </div>

        <Editable
          ref={editableRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-invalid={!!errorText}
          data-placeholder={placeholder}
          data-testid={dataTestId}
          onInput={onInput}
          onBeforeInput={onBeforeInput}
          onCompositionEnd={onCompositionEnd}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onClick={onClick}
          onPaste={onPaste}
          onBlur={emitChange}
        />

        {errorText && (
          <ValidationMessage
            role="alert"
            data-testid={
              dataTestId ? `${dataTestId}-error` : 'mention-editor-error'
            }
          >
            {errorText}
          </ValidationMessage>
        )}

        {/* Real IDS Badge rendered into each mention host via a portal. */}
        {badgeHosts.map((host) =>
          createPortal(
            <Badge status="info" priority="secondary" capitalization="sentence">
              {`@${host.dataset.name ?? ''}`}
            </Badge>,
            host,
            host.dataset.bid,
          ),
        )}

        <MentionMenu
          open={menuOpen}
          anchorElement={anchor}
          workers={workers}
          loading={loading}
          query={query}
          highlightIndex={highlightIndex}
          onSelect={insertMention}
          onClose={closeMenu}
        />
      </EditorShell>
    );
  },
);

MentionEditor.displayName = 'MentionEditor';

export default MentionEditor;
