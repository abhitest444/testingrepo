import { renderHook } from '@testing-library/react-hooks';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import {
  extractLegacyQboUserName,
  useLegacyQboUserNames,
} from 'src/js/widgets/timeProject/hooks/useLegacyQboUserNames';
import { GET_IDENTITY_PROFILE } from 'src/js/widgets/timeProject/graphql/identityQueries';

const mockQuery = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useApolloClient: () => ({ query: mockQuery }),
}));

jest.mock('src/js/widgets/timeProject/utils/timeProjectLogging', () => ({
  useTimeProjectLogger: () => ({
    error: mockLoggerError,
    info: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  }),
}));

describe('extractLegacyQboUserName', () => {
  it('returns givenName/familyName/fullName when present', () => {
    const result = extractLegacyQboUserName({
      profile: {
        personInfo: {
          name: {
            givenName: 'Jane',
            familyName: 'Doe',
            fullName: 'Jane M. Doe',
          },
          contactInfo: { emails: [{ email: 'jane@example.com' }] },
        },
      },
    });
    expect(result).toEqual({
      firstName: 'Jane',
      lastName: 'Doe',
      // Prefers fullName over composed firstName+lastName so accented or
      // suffixed names from Identity are preserved verbatim.
      displayName: 'Jane M. Doe',
    });
  });

  it('falls back to first email when both name fields are blank', () => {
    const result = extractLegacyQboUserName({
      profile: {
        personInfo: {
          name: { givenName: '', familyName: '', fullName: '' },
          contactInfo: {
            emails: [{ email: 'fallback@example.com' }],
          },
        },
      },
    });
    expect(result.firstName).toBe('fallback@example.com');
    expect(result.lastName).toBe('');
    expect(result.displayName).toBe('fallback@example.com');
  });

  it('returns empty strings when neither name nor email is available', () => {
    expect(
      extractLegacyQboUserName({
        profile: { personInfo: { name: null, contactInfo: null } },
      }),
    ).toEqual({ firstName: '', lastName: '', displayName: '' });
    expect(extractLegacyQboUserName(null)).toEqual({
      firstName: '',
      lastName: '',
      displayName: '',
    });
  });

  it('composes display name from given+family when fullName missing', () => {
    const result = extractLegacyQboUserName({
      profile: {
        personInfo: {
          name: { givenName: 'Jane', familyName: 'Doe' },
          contactInfo: null,
        },
      },
    });
    expect(result.displayName).toBe('Jane Doe');
  });
});

describe('useLegacyQboUserNames', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes the Identity query through the IDENTITY clientName context', async () => {
    mockQuery.mockResolvedValue({
      data: {
        profile: {
          personInfo: {
            name: {
              givenName: 'Jane',
              familyName: 'Doe',
              fullName: 'Jane Doe',
            },
            contactInfo: { emails: [] },
          },
        },
      },
    });
    const { result } = renderHook(() => useLegacyQboUserNames());
    const name = await result.current.fetchName('persona-1');

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).toHaveBeenCalledWith({
      query: GET_IDENTITY_PROFILE,
      variables: { input: { profileId: 'persona-1', profileStatus: 'ACTIVE' } },
      fetchPolicy: 'no-cache',
      context: { clientName: ApolloClientNames.IDENTITY },
    });
    expect(name).toEqual({
      firstName: 'Jane',
      lastName: 'Doe',
      displayName: 'Jane Doe',
    });
  });

  it('memoizes by profileId so paginated re-fetches do not re-hit Identity', async () => {
    mockQuery.mockResolvedValue({
      data: {
        profile: {
          personInfo: {
            name: { givenName: 'A', familyName: 'B', fullName: 'A B' },
            contactInfo: { emails: [] },
          },
        },
      },
    });
    const { result } = renderHook(() => useLegacyQboUserNames());
    await result.current.fetchName('persona-1');
    await result.current.fetchName('persona-1');
    await result.current.fetchName('persona-1');
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('logs and returns empty name when Identity rejects', async () => {
    mockQuery.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useLegacyQboUserNames());
    const name = await result.current.fetchName('persona-err');
    expect(name).toEqual({ firstName: '', lastName: '', displayName: '' });
    expect(mockLoggerError).toHaveBeenCalledWith(
      'Component=useLegacyQboUserNames Error=Identity Profile Fetch Failed',
      expect.objectContaining({
        profileId: 'persona-err',
        exception: 'boom',
      }),
    );
  });

  it('returns empty name without calling Identity for falsy profile ids', async () => {
    const { result } = renderHook(() => useLegacyQboUserNames());
    const name = await result.current.fetchName('');
    expect(name).toEqual({ firstName: '', lastName: '', displayName: '' });
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('fetchNames de-duplicates ids and resolves a map keyed by id', async () => {
    mockQuery.mockImplementation(({ variables }: any) => {
      const { profileId } = variables.input;
      return Promise.resolve({
        data: {
          profile: {
            personInfo: {
              name: {
                givenName: profileId,
                familyName: '',
                fullName: profileId,
              },
              contactInfo: { emails: [] },
            },
          },
        },
      });
    });
    const { result } = renderHook(() => useLegacyQboUserNames());
    const names = await result.current.fetchNames(['p1', 'p2', 'p1', '', 'p2']);
    expect(mockQuery).toHaveBeenCalledTimes(2);
    expect(names).toEqual({
      p1: { firstName: 'p1', lastName: '', displayName: 'p1' },
      p2: { firstName: 'p2', lastName: '', displayName: 'p2' },
    });
  });

  it('fetchNames returns empty map when given no ids', async () => {
    const { result } = renderHook(() => useLegacyQboUserNames());
    const names = await result.current.fetchNames([]);
    expect(names).toEqual({});
    expect(mockQuery).not.toHaveBeenCalled();
  });
});
