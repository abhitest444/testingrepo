import gql from 'graphql-tag';

export const PROFILE_COMPANY_AND_ROLES_QUERY = gql`
  query getProfileCompanyAndRoles($filterBy: ProfileSearchInput!) {
    profileSearch(filterBy: $filterBy) {
      edges {
        node {
          accountId
          account {
            accountProfile {
              businessInfo {
                displayName
              }
            }
          }
          roles {
            name
            roleType
            canonicalName
          }
        }
      }
    }
  }
`;
