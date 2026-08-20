import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MentionEditor, {
  MentionEditorHandle,
} from 'src/js/widgets/timeProject/components/posts/mentions/MentionEditor';

// Heavy/design-system deps are stubbed out — this suite targets the editor's
// own character-cap logic (onBeforeInput / onInput fallback / onPaste), not
// mention search or IDS chrome.
jest.mock(
  'src/js/widgets/timeProject/components/posts/mentions/useMentionSearch',
  () => ({
    useMentionSearch: () => ({
      workers: [],
      loading: false,
      search: jest.fn(),
      cancel: jest.fn(),
    }),
  }),
);

jest.mock(
  'src/js/widgets/timeProject/components/posts/mentions/MentionMenu',
  () => () => null,
);

jest.mock('@ids-ts/textarea', () => ({
  __esModule: true,
  default: () => <textarea aria-hidden readOnly value="" />,
}));

jest.mock('@ids-ts/badge', () => ({
  __esModule: true,
  default: ({ children }: any) => <span>{children}</span>,
}));

const renderEditor = (
  props: Partial<React.ComponentProps<typeof MentionEditor>> = {},
) => {
  const onChange = props.onChange ?? jest.fn();
  const ref = React.createRef<MentionEditorHandle>();
  render(
    <MentionEditor
      ref={ref}
      onChange={onChange}
      data-testid="editor"
      {...props}
    />,
  );
  const editable = screen.getByTestId('editor');
  return { editable, onChange, ref };
};

// Places a collapsed caret at the given offset within the editable's first
// (and, in these tests, only) text node — mirrors where a real caret would
// sit after the browser applies a keystroke.
const placeCaret = (editable: HTMLElement, offset: number) => {
  const textNode = editable.firstChild as Text;
  const range = document.createRange();
  range.setStart(textNode, offset);
  range.collapse(true);
  const sel = window.getSelection();
  sel?.removeAllRanges();
  sel?.addRange(range);
};

// Simulates "the browser already inserted this character" (jsdom doesn't
// perform real contenteditable typing) by writing the post-keystroke text
// directly into the DOM, placing the caret at the end, then firing the same
// `input` event the browser would dispatch next — driving the component's
// actual onInput handler (trimOverflow + emitChange).
const typeInto = (editable: HTMLElement, nextText: string) => {
  editable.textContent = nextText;
  placeCaret(editable, nextText.length);
  act(() => {
    fireEvent(editable, new Event('input', { bubbles: true }));
  });
};

describe('MentionEditor character cap', () => {
  describe('onInput overflow fallback (trimOverflow)', () => {
    it('does nothing while under the cap', () => {
      const { editable, onChange } = renderEditor({ maxLength: 5 });
      typeInto(editable, 'abcd');
      expect(editable.textContent).toBe('abcd');
      expect(onChange).toHaveBeenLastCalledWith('abcd');
    });

    it('allows typing exactly up to the cap', () => {
      const { editable, onChange } = renderEditor({ maxLength: 5 });
      typeInto(editable, 'abcde');
      expect(editable.textContent).toBe('abcde');
      expect(onChange).toHaveBeenLastCalledWith('abcde');
    });

    it('trims the character that would push it over the cap', () => {
      const { editable, onChange } = renderEditor({ maxLength: 5 });
      // Simulates the browser having already inserted a 6th character
      // despite the beforeinput block missing it — the input-event
      // fallback must remove it immediately.
      typeInto(editable, 'abcdef');
      expect(editable.textContent).toBe('abcde');
      expect(onChange).toHaveBeenLastCalledWith('abcde');
    });

    it('trims a multi-character overflow (e.g. IME committing several chars at once)', () => {
      const { editable, onChange } = renderEditor({ maxLength: 5 });
      typeInto(editable, 'abcdeXYZ');
      expect(editable.textContent).toBe('abcde');
      expect(onChange).toHaveBeenLastCalledWith('abcde');
    });

    it('restores the caret right after the trimmed text so typing can continue', () => {
      const { editable } = renderEditor({ maxLength: 5 });
      typeInto(editable, 'abcdef');
      const sel = window.getSelection();
      expect(sel?.getRangeAt(0).startOffset).toBe(5);
      expect(sel?.getRangeAt(0).startContainer).toBe(editable.firstChild);
    });

    it('is a no-op when maxLength is not provided', () => {
      const { editable, onChange } = renderEditor();
      typeInto(editable, 'a'.repeat(50));
      expect(editable.textContent).toHaveLength(50);
      expect(onChange).toHaveBeenLastCalledWith('a'.repeat(50));
    });
  });

  describe('onPaste', () => {
    // document.execCommand isn't implemented in jsdom; stub it so we can
    // assert exactly what text the handler decided to insert.
    let execCommandSpy: jest.Mock;
    beforeEach(() => {
      execCommandSpy = jest.fn();
      document.execCommand =
        execCommandSpy as unknown as typeof document.execCommand;
    });

    const paste = (editable: HTMLElement, text: string) => {
      act(() => {
        fireEvent.paste(editable, {
          clipboardData: { getData: () => text },
        });
      });
    };

    it('inserts the full pasted text when it fits under the cap', () => {
      const { editable } = renderEditor({ maxLength: 20 });
      paste(editable, 'hello');
      expect(execCommandSpy).toHaveBeenCalledWith('insertText', false, 'hello');
    });

    it('truncates pasted text to the remaining room under the cap', () => {
      const { editable } = renderEditor({ maxLength: 10 });
      editable.textContent = 'abcde'; // 5 chars already present, 5 remaining
      placeCaret(editable, 5);
      paste(editable, '1234567890');
      expect(execCommandSpy).toHaveBeenCalledWith('insertText', false, '12345');
    });

    it('drops the paste entirely when already at the cap', () => {
      const { editable } = renderEditor({ maxLength: 5 });
      editable.textContent = 'abcde';
      placeCaret(editable, 5);
      paste(editable, 'more text');
      expect(execCommandSpy).not.toHaveBeenCalled();
    });
  });
});
