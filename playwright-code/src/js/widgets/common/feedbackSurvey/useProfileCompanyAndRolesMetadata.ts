import { useMemo } from 'react';
import { ApolloClient, NormalizedCacheObject, useQuery } from '@apollo/client';
import { Sandbox } from 'src/js/common/sandbox';
import { ApolloClientNames } from 'src/js/service/ApolloClientBuilderUtils';
import { PROFILE_COMPANY_AND_ROLES_QUERY } from 'src/js/service/queries/profileQueries';
import { ProfileCompanyAndRolesMetadata } from 'src/js/widgets/common/feedbackSurvey/qualtricsContextUtils';

interface UseProfileCompanyAndRolesMetadataOptions {
  sandbox: Sandbox;
  enabled: boolean;
  client?: ApolloClient<NormalizedCacheObject>;
}

interface IdentityRoleNode {
  canonicalName?: string | null;
  roleType?: string | null;
  name?: string | null;
}

interface ProfileSearchNode {
  accountId?: string | null;
  account?: {
    accountProfile?: {
      businessInfo?: {
        displayName?: string | null;
      } | null;
    } | null;
  } | null;
  roles?: IdentityRoleNode[] | null;
}

interface ProfileCompanyAndRolesMetadataQueryData {
  profileSearch?: {
    edges?: Array<{
      node?: ProfileSearchNode | null;
    } | null> | null;
  } | null;
}

const DEFAULT_PROFILE_COMPANY_AND_ROLES_METADATA: ProfileCompanyAndRolesMetadata =
  {
    companyName: '',
  };

const getProfileNodeForRealm = (
  data: ProfileCompanyAndRolesMetadataQueryData | undefined,
  realmId?: string,
): ProfileSearchNode | undefined => {
  const nodes =
    data?.profileSearch?.edges
      ?.map((edge) => edge?.node || undefined)
      .filter((node): node is ProfileSearchNode => Boolean(node)) || [];

  if (!nodes.length) {
    return undefined;
  }

  if (!realmId) {
    return nodes[0];
  }

  return nodes.find((node) => node.accountId === realmId);
};

export const useProfileCompanyAndRolesMetadata = ({
  sandbox,
  enabled,
  client,
}: UseProfileCompanyAndRolesMetadataOptions): ProfileCompanyAndRolesMetadata => {
  const realmId = sandbox.appContext?.getRealmInfo?.()?.realmId;
  const authId = sandbox.appContext?.getUserAuthInfo?.()?.authId;
  const shouldSkip = !enabled || !realmId || !authId;

  const { data, error } = useQuery<ProfileCompanyAndRolesMetadataQueryData>(
    PROFILE_COMPANY_AND_ROLES_QUERY,
    {
      client,
      skip: shouldSkip,
      variables: {
        filterBy: {
          claimedByFilter: {
            claimedBy: {
              eq: authId,
            },
          },
        },
      },
      context: {
        clientName: ApolloClientNames.IDENTITY,
      },
      fetchPolicy: 'cache-first',
    },
  );

  return useMemo(() => {
    if (shouldSkip) {
      return DEFAULT_PROFILE_COMPANY_AND_ROLES_METADATA;
    }

    const profileNode = getProfileNodeForRealm(data, realmId);
    const companyName =
      profileNode?.account?.accountProfile?.businessInfo?.displayName || '';

    const mappedRoles =
      profileNode?.roles
        ?.filter((role): role is IdentityRoleNode => Boolean(role))
        .filter((role) => Boolean(role.canonicalName))
        .map((role) => ({
          roleId: role.canonicalName as string,
          roleType: role.roleType || undefined,
          name: role.name || undefined,
        }))
        .filter((role) => Boolean(role.roleId)) || [];

    if (error || !profileNode) {
      return {
        companyName,
      };
    }

    return {
      companyName,
      ...(mappedRoles.length > 0 ? { userRoles: mappedRoles } : {}),
    };
  }, [shouldSkip, data, realmId, error]);
};
