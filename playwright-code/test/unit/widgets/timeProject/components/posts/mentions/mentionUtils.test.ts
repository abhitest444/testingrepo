import {
  buildMentionToken,
  parseMentionToken,
  hydrateMentions,
} from 'src/js/widgets/timeProject/components/posts/mentions/mentionUtils';
import { PostMention } from 'src/js/widgets/timeProject/types/posts';

describe('mentionUtils', () => {
  describe('buildMentionToken / parseMentionToken', () => {
    it('builds a <TYPE_ID> token', () => {
      expect(buildMentionToken('EMPLOYEE', '6')).toBe('<EMPLOYEE_6>');
      expect(buildMentionToken('VENDOR', '42')).toBe('<VENDOR_42>');
    });

    it('parses a token back to its type + id', () => {
      expect(parseMentionToken('<EMPLOYEE_6>')).toEqual({
        type: 'EMPLOYEE',
        workerId: '6',
      });
    });

    it('keeps the id as the trailing segment for multi-word types', () => {
      expect(parseMentionToken('<LEGACY_QBO_USER_99>')).toEqual({
        type: 'LEGACY_QBO_USER',
        workerId: '99',
      });
    });

    it('returns null for non-tokens', () => {
      expect(parseMentionToken('hello')).toBeNull();
      expect(parseMentionToken('<broken')).toBeNull();
    });
  });

  describe('hydrateMentions', () => {
    const mentions: PostMention[] = [
      {
        workerId: '6',
        displayName: 'Jane Doe',
        token: '<EMPLOYEE_6>',
        active: true,
      },
    ];

    it('resolves a token to its "@Name" display form', () => {
      expect(hydrateMentions('hi <EMPLOYEE_6>!', mentions).text).toBe(
        'hi @Jane Doe!',
      );
    });

    it('resolves every occurrence of a token', () => {
      expect(
        hydrateMentions('<EMPLOYEE_6> and <EMPLOYEE_6>', mentions).text,
      ).toBe('@Jane Doe and @Jane Doe');
    });

    it('leaves unknown / unnamed tokens untouched', () => {
      expect(
        hydrateMentions('hi <EMPLOYEE_6>', [
          {
            workerId: '6',
            displayName: null,
            token: '<EMPLOYEE_6>',
            active: true,
          },
        ]).text,
      ).toBe('hi <EMPLOYEE_6>');
    });

    it('returns the content unchanged when there are no mentions', () => {
      expect(hydrateMentions('plain text', []).text).toBe('plain text');
    });
  });
});
