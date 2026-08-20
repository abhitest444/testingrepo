import {
  buildBadgeElement,
  domToDisplay,
  domToSave,
  hydrateToFragment,
} from 'src/js/widgets/timeProject/components/posts/mentions/editorSerialize';
import { PostMention } from 'src/js/widgets/timeProject/types/posts';

const NBSP = String.fromCharCode(160);

// Build an editor root whose children are the given (text | badge) parts.
const editor = (
  parts: Array<string | { name: string; token: string }>,
): HTMLDivElement => {
  const root = document.createElement('div');
  parts.forEach((p) => {
    if (typeof p === 'string') {
      root.appendChild(document.createTextNode(p));
    } else {
      root.appendChild(buildBadgeElement(p.name, p.token));
    }
  });
  return root;
};

describe('editorSerialize', () => {
  describe('buildBadgeElement', () => {
    it('creates an atomic, non-editable host carrying token + name', () => {
      const badge = buildBadgeElement('Jane Doe', '<EMPLOYEE_6>');
      expect(badge.dataset.mention).toBe('');
      expect(badge.dataset.token).toBe('<EMPLOYEE_6>');
      expect(badge.dataset.name).toBe('Jane Doe');
      expect(badge.contentEditable).toBe('false');
    });
  });

  describe('domToSave', () => {
    it('replaces badge nodes with their "<TYPE_ID>" token', () => {
      const root = editor([
        'hi ',
        { name: 'Jane Doe', token: '<EMPLOYEE_6>' },
        ' there',
      ]);
      expect(domToSave(root)).toBe('hi <EMPLOYEE_6> there');
    });

    it('normalizes non-breaking spaces to regular spaces', () => {
      // contenteditable tends to insert NBSP after an atomic badge node.
      const root = editor([
        { name: 'Jane Doe', token: '<VENDOR_31>' },
        `${NBSP}rest`,
      ]);
      const out = domToSave(root);
      expect(out).toBe('<VENDOR_31> rest');
      expect(out).not.toContain(NBSP);
    });

    it('keeps multiple mentions distinct and in order', () => {
      const root = editor([
        { name: 'Ann', token: '<EMPLOYEE_6>' },
        ' and ',
        { name: 'Bo', token: '<VENDOR_7>' },
      ]);
      expect(domToSave(root)).toBe('<EMPLOYEE_6> and <VENDOR_7>');
    });
  });

  describe('domToDisplay', () => {
    it('renders badges as "@Name" and normalizes NBSP', () => {
      const root = editor([
        { name: 'Jane Doe', token: '<EMPLOYEE_6>' },
        `${NBSP}hi`,
      ]);
      expect(domToDisplay(root)).toBe('@Jane Doe hi');
    });

    it('converts <br> to newline', () => {
      const root = document.createElement('div');
      root.appendChild(document.createTextNode('line1'));
      root.appendChild(document.createElement('br'));
      root.appendChild(document.createTextNode('line2'));
      expect(domToDisplay(root)).toBe('line1\nline2');
    });

    it('strips the trailing placeholder <br> from an empty editor', () => {
      const root = document.createElement('div');
      root.appendChild(document.createElement('br'));
      expect(domToDisplay(root)).toBe('');
    });

    it('strips one trailing <br> when content ends with a line break', () => {
      const root = document.createElement('div');
      root.appendChild(document.createTextNode('hello'));
      root.appendChild(document.createElement('br'));
      root.appendChild(document.createElement('br'));
      expect(domToDisplay(root)).toBe('hello\n');
    });
  });

  describe('hydrateToFragment', () => {
    const mentions: PostMention[] = [
      {
        workerId: '6',
        displayName: 'Jane Doe',
        token: '<EMPLOYEE_6>',
        active: true,
      },
    ];

    it('turns tokens into badge nodes and leaves other text alone', () => {
      const frag = hydrateToFragment('hi <EMPLOYEE_6>!', mentions);
      const root = document.createElement('div');
      root.appendChild(frag);
      const badges = root.querySelectorAll('[data-mention]');
      expect(badges).toHaveLength(1);
      expect((badges[0] as HTMLElement).dataset.token).toBe('<EMPLOYEE_6>');
      // Round-trips back to the saved form.
      expect(domToSave(root)).toBe('hi <EMPLOYEE_6>!');
      // And displays the name.
      expect(domToDisplay(root)).toBe('hi @Jane Doe!');
    });

    it('leaves unknown / unnamed tokens as plain text', () => {
      const frag = hydrateToFragment('hi <EMPLOYEE_6>', [
        {
          workerId: '6',
          displayName: null,
          token: '<EMPLOYEE_6>',
          active: true,
        },
      ]);
      const root = document.createElement('div');
      root.appendChild(frag);
      expect(root.querySelectorAll('[data-mention]')).toHaveLength(0);
      expect(domToSave(root)).toBe('hi <EMPLOYEE_6>');
    });

    it('returns plain text when there are no mentions', () => {
      const frag = hydrateToFragment('just text', []);
      const root = document.createElement('div');
      root.appendChild(frag);
      expect(domToSave(root)).toBe('just text');
    });
  });
});
