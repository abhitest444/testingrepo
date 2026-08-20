import { useCallback, useRef } from 'react';
import { ApolloClient, useApolloClient } from '@apollo/client';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { GET_IDENTITY_PROFILE } from '../graphql/identityQueries';
import { useTimeProjectLogger } from '../utils/timeProjectLogging';

export interface LegacyQboUserName {
  firstName: string;
  lastName: string;
  displayName: string;
}

const EMPTY_NAME: LegacyQboUserName = {
  firstName: '',
  lastName: '',
  displayName: '',
};

interface IdentityEmail {
  email?: string | null;
}

interface IdentityName {
  givenName?: string | null;
  familyName?: string | null;
  fullName?: string | null;
}

interface IdentityProfileResponse {
  profile?: {
    personInfo?: {
      contactInfo?: {
        emails?: IdentityEmail[] | null;
      } | null;
      name?: IdentityName | null;
    } | null;
  } | null;
}

const composeDisplayName = (
  firstName: string,
  lastName: string,
  fullName: string,
): string => {
  if (fullName) return fullName;
  const composed = `${firstName} ${lastName}`.trim();
  return composed || firstName || lastName;
};

export const extractLegacyQboUserName = (
  data: IdentityProfileResponse | null | undefined,
): LegacyQboUserName => {
  const personInfo = data?.profile?.personInfo;
  let firstName = personInfo?.name?.givenName ?? '';
  let lastName = personInfo?.name?.familyName ?? '';
  const fullName = personInfo?.name?.fullName ?? '';

  // Identity returns blank `givenName` / `familyName` for some legacy
  // personas. Mirror the legacy fallback used in TimeSummaryFreeData and
  // surface the first email so the worker is still identifiable in the UI.
  if (!firstName && !lastName) {
    const emails = personInfo?.contactInfo?.emails ?? [];
    firstName = emails[0]?.email ?? '';
    lastName = '';
  }

  return {
    firstName,
    lastName,
    displayName: composeDisplayName(firstName, lastName, fullName),
  };
};

const fetchSingleProfile = async (
  client: ApolloClient<unknown>,
  profileId: string,
): Promise<LegacyQboUserName> => {
  const { data } = await client.query<IdentityProfileResponse>({
    query: GET_IDENTITY_PROFILE,
    variables: {
      input: { profileId, profileStatus: 'ACTIVE' },
    },
    fetchPolicy: 'no-cache',
    context: { clientName: ApolloClientNames.IDENTITY },
  });
  return extractLegacyQboUserName(data);
};

/**
 * Resolves display names for LEGACY_QBO_USER worker rows by hitting the
 * Identity service. The TimeTracking supergraph cannot stitch DAS contacts
 * for legacy QBO personas, so `timeForContactDAS` is `null` and we have to
 * follow up with `profile(input: { profileId })` to get the name (or fall
 * back to email).
 *
 * Results are memoized in-process for the lifetime of the hook so paginated
 * navigation through the worker table doesn't refetch the same persona.
 */
export const useLegacyQboUserNames = () => {
  const client = useApolloClient() as unknown as ApolloClient<unknown>;
  const logger = useTimeProjectLogger();
  const cacheRef = useRef<Map<string, LegacyQboUserName>>(new Map());

  const fetchName = useCallback(
    async (profileId: string): Promise<LegacyQboUserName> => {
      if (!profileId) return EMPTY_NAME;
      const cached = cacheRef.current.get(profileId);
      if (cached) return cached;

      try {
        const name = await fetchSingleProfile(client, profileId);
        cacheRef.current.set(profileId, name);
        return name;
      } catch (error) {
        // Mirror the legacy logging shape so Splunk dashboards can pivot on
        // `Component` / `Error` like every other timeProject log line.
        logger.error(
          'Component=useLegacyQboUserNames Error=Identity Profile Fetch Failed',
          {
            profileId,
            exception: error instanceof Error ? error.message : String(error),
          },
        );
        return EMPTY_NAME;
      }
    },
    [client, logger],
  );

  const fetchNames = useCallback(
    async (
      profileIds: string[],
    ): Promise<Record<string, LegacyQboUserName>> => {
      const unique = Array.from(
        new Set(profileIds.filter((id): id is string => Boolean(id))),
      );
      if (unique.length === 0) return {};
      const results = await Promise.all(
        unique.map(async (id) => [id, await fetchName(id)] as const),
      );
      return Object.fromEntries(results);
    },
    [fetchName],
  );

  return { fetchName, fetchNames };
};
