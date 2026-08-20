import {
  mapPostNode,
  renderPostContent,
  parsePostContent,
  getAuthorInitials,
  formatPostTimestamp,
} from 'src/js/widgets/timeProject/utils/postsMappers';
import {
  PostNodeGQL,
  PostMention,
} from 'src/js/widgets/timeProject/types/posts';

const mockMapTimezone = jest.fn((_tz?: string | null) => 'America/Los_Angeles');
jest.mock('src/js/common/DateAndTimeUtils', () => ({
  // Mirror the real util: it always returns a mapped IANA zone and
  // defaults to Pacific for empty/unknown input. `formatPostTimestamp`
  // only calls it when `qbTimezone` is truthy, so the "missing timezone =>
  // local" path is driven by the caller not passing a timezone, not by the
  // mapper returning ''.
  mapQBTimezoneToDayjsTimezone: (tz?: string | null) => mockMapTimezone(tz),
}));

const baseNode: PostNodeGQL = {
  id: '53493126',
  projectId: '429610453',
  customerId: '5',
  content: 'test post 1 <EMPLOYEE_6>',
  parentPostId: null,
  replyCount: 1,
  unreadReplyCount: 1,
  worker: {
    id: '6',
    type: 'EMPLOYEE',
    firstName: 'test admin',
    lastName: 'admin',
    displayName: 'test admin admin',
    isActive: true,
  },
  contentAttachments: [
    {
      id: '2147483648',
      documentId: 'ab4f9c2e',
      fileName: 'photo1.jpg',
      orientationDegree: 0,
      meta: { createdAt: '2026-06-16T07:39:49.000Z', createdBy: '934145' },
    },
  ],
  postMentions: [
    {
      workerId: '6',
      displayName: 'test admin admin',
      token: '<EMPLOYEE_6>',
      active: true,
    },
  ],
  postMeta: {
    createdAt: '2026-06-16T06:45:46.000Z',
    updatedAt: '2026-06-16T06:50:00.000Z',
    createdBy: '934145',
    updatedBy: '934145',
  },
};

describe('postsMappers', () => {
  describe('mapPostNode', () => {
    it('maps a full node to the Post domain model', () => {
      const post = mapPostNode(baseNode);
      expect(post.id).toBe('53493126');
      expect(post.projectId).toBe('429610453');
      expect(post.customerId).toBe('5');
      expect(post.author.displayName).toBe('test admin admin');
      expect(post.content).toBe('test post 1 <EMPLOYEE_6>');
      expect(post.replyCount).toBe(1);
      expect(post.unreadReplyCount).toBe(1);
      expect(post.createdAt).toBe('2026-06-16T06:45:46.000Z');
      expect(post.updatedAt).toBe('2026-06-16T06:50:00.000Z');
    });

    it('maps attachments with flattened meta', () => {
      const post = mapPostNode(baseNode);
      expect(post.attachments).toHaveLength(1);
      expect(post.attachments[0]).toMatchObject({
        id: '2147483648',
        documentId: 'ab4f9c2e',
        fileName: 'photo1.jpg',
        orientationDegree: 0,
        createdAt: '2026-06-16T07:39:49.000Z',
        createdBy: '934145',
      });
    });

    it('falls back to empties for null worker / content / mentions / attachments', () => {
      const post = mapPostNode({
        ...baseNode,
        worker: null,
        content: null,
        postMentions: null,
        contentAttachments: null,
      });
      expect(post.author).toEqual({ id: '' });
      expect(post.content).toBe('');
      expect(post.mentions).toEqual([]);
      expect(post.attachments).toEqual([]);
    });
  });

  describe('renderPostContent', () => {
    it('replaces a mention token with the resolved display name', () => {
      expect(
        renderPostContent(
          'test post 1 <EMPLOYEE_6>',
          baseNode.postMentions as PostMention[],
        ),
      ).toBe('test post 1 test admin admin');
    });

    it('replaces every occurrence of a token', () => {
      const mentions: PostMention[] = [
        {
          workerId: '6',
          displayName: 'Jane',
          token: '<EMPLOYEE_6>',
          active: true,
        },
      ];
      expect(
        renderPostContent('<EMPLOYEE_6> and again <EMPLOYEE_6>', mentions),
      ).toBe('Jane and again Jane');
    });

    it('returns content unchanged when there are no mentions', () => {
      expect(renderPostContent('plain text', [])).toBe('plain text');
    });

    it('returns empty content unchanged', () => {
      expect(
        renderPostContent('', baseNode.postMentions as PostMention[]),
      ).toBe('');
    });

    it('falls back to the token when displayName is missing/blank', () => {
      const mentions: PostMention[] = [
        {
          workerId: '6',
          displayName: '   ',
          token: '<EMPLOYEE_6>',
          active: true,
        },
      ];
      expect(renderPostContent('hi <EMPLOYEE_6>', mentions)).toBe(
        'hi <EMPLOYEE_6>',
      );
    });

    it('skips mentions with an empty token', () => {
      const mentions: PostMention[] = [
        { workerId: '6', displayName: 'Jane', token: '', active: true },
      ];
      expect(renderPostContent('hi there', mentions)).toBe('hi there');
    });
  });

  describe('parsePostContent', () => {
    const mentions: PostMention[] = [
      {
        workerId: '6',
        displayName: 'test admin admin',
        token: '<EMPLOYEE_6>',
        active: true,
      },
    ];

    it('returns [] for empty content', () => {
      expect(parsePostContent('', mentions)).toEqual([]);
    });

    it('returns a single text segment when there are no mentions', () => {
      expect(parsePostContent('plain text', [])).toEqual([
        { type: 'text', value: 'plain text' },
      ]);
    });

    it('splits content into text + mention segments', () => {
      expect(parsePostContent('test post 1 <EMPLOYEE_6>', mentions)).toEqual([
        { type: 'text', value: 'test post 1 ' },
        { type: 'mention', value: 'test admin admin', workerId: '6' },
      ]);
    });

    it('keeps trailing text after a mention', () => {
      expect(parsePostContent('hi <EMPLOYEE_6> bye', mentions)).toEqual([
        { type: 'text', value: 'hi ' },
        { type: 'mention', value: 'test admin admin', workerId: '6' },
        { type: 'text', value: ' bye' },
      ]);
    });

    it('handles repeated mentions', () => {
      const segs = parsePostContent('<EMPLOYEE_6> and <EMPLOYEE_6>', mentions);
      expect(segs.filter((s) => s.type === 'mention')).toHaveLength(2);
    });

    it('falls back to the token when displayName is blank', () => {
      const blank: PostMention[] = [
        {
          workerId: '6',
          displayName: '  ',
          token: '<EMPLOYEE_6>',
          active: true,
        },
      ];
      expect(parsePostContent('x <EMPLOYEE_6>', blank)).toEqual([
        { type: 'text', value: 'x ' },
        { type: 'mention', value: '<EMPLOYEE_6>', workerId: '6' },
      ]);
    });

    it('detects an https link as a link segment', () => {
      expect(parsePostContent('see https://intuit.com now', [])).toEqual([
        { type: 'text', value: 'see ' },
        {
          type: 'link',
          value: 'https://intuit.com',
          href: 'https://intuit.com',
        },
        { type: 'text', value: ' now' },
      ]);
    });

    it('detects an http link', () => {
      const segs = parsePostContent('http://example.com', []);
      expect(segs).toEqual([
        {
          type: 'link',
          value: 'http://example.com',
          href: 'http://example.com',
        },
      ]);
    });

    it('strips trailing punctuation out of the link', () => {
      expect(parsePostContent('go to https://intuit.com.', [])).toEqual([
        { type: 'text', value: 'go to ' },
        {
          type: 'link',
          value: 'https://intuit.com',
          href: 'https://intuit.com',
        },
        { type: 'text', value: '.' },
      ]);
    });

    it('handles both a mention and a link in the same content', () => {
      const segs = parsePostContent('<EMPLOYEE_6> see https://x.com', mentions);
      expect(segs).toEqual([
        { type: 'mention', value: 'test admin admin', workerId: '6' },
        { type: 'text', value: ' see ' },
        { type: 'link', value: 'https://x.com', href: 'https://x.com' },
      ]);
    });

    it('does not treat a non-http string as a link', () => {
      expect(parsePostContent('ftp://x.com and www.x.com', [])).toEqual([
        { type: 'text', value: 'ftp://x.com and www.x.com' },
      ]);
    });
  });

  describe('getAuthorInitials', () => {
    it('returns first+last initials from a display name', () => {
      expect(getAuthorInitials('test admin admin')).toBe('TA');
    });

    it('returns a single initial for a one-word name', () => {
      expect(getAuthorInitials('Garrett')).toBe('G');
    });

    it('builds from first/last when displayName is absent', () => {
      expect(getAuthorInitials(null, 'John', 'Doe')).toBe('JD');
    });

    it('returns "?" when there is no name', () => {
      expect(getAuthorInitials(null, null, null)).toBe('?');
      expect(getAuthorInitials('')).toBe('?');
    });
  });

  describe('formatPostTimestamp', () => {
    beforeEach(() => {
      mockMapTimezone.mockClear();
    });

    it('returns empty string for empty input', () => {
      expect(formatPostTimestamp('')).toBe('');
    });

    it('maps the timezone only when a company timezone is provided', () => {
      formatPostTimestamp('2020-03-14T09:41:00.000Z', 'PST');
      expect(mockMapTimezone).toHaveBeenCalledWith('PST');
    });

    it('does NOT map a timezone (uses local) when qbTimezone is empty', () => {
      // Guards the regression: mapQBTimezoneToDayjsTimezone('') would
      // default to Pacific, so we must not call it for an empty timezone.
      formatPostTimestamp('2020-03-14T09:41:00.000Z', '');
      expect(mockMapTimezone).not.toHaveBeenCalled();
    });

    it('does NOT map a timezone when qbTimezone is undefined', () => {
      formatPostTimestamp('2020-03-14T09:41:00.000Z');
      expect(mockMapTimezone).not.toHaveBeenCalled();
    });

    it('returns empty string for an invalid timestamp', () => {
      expect(formatPostTimestamp('not-a-date', 'PST')).toBe('');
    });

    it('prefixes "Today" for a same-day timestamp', () => {
      const now = new Date().toISOString();
      expect(formatPostTimestamp(now, 'PST')).toMatch(/^Today, /);
    });

    it('prefixes "Yesterday" for a previous-day timestamp', () => {
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000,
      ).toISOString();
      expect(formatPostTimestamp(yesterday, 'PST')).toMatch(/^Yesterday, /);
    });

    it('uses a month/day label for older timestamps', () => {
      // Fixed past date — should not be Today/Yesterday.
      const label = formatPostTimestamp('2020-03-14T09:41:00.000Z', 'PST');
      expect(label).toMatch(/^Mar \d+, /);
    });

    it('falls back to local time when no timezone is provided', () => {
      const now = new Date().toISOString();
      expect(formatPostTimestamp(now)).toMatch(/^Today, /);
    });
  });
});
