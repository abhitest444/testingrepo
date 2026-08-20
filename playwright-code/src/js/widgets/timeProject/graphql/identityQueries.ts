import gql from 'graphql-tag';

/**
 * Identity-service profile lookup used to resolve display names for
 * LEGACY_QBO_USER rows in the worker time summary. The TimeTracking
 * supergraph cannot stitch DAS contacts for legacy QBO personas, so the
 * `timeForContactDAS` payload comes back as `null`. We hop over to
 * Identity with the persona id to pull `givenName` / `familyName` (and
 * fall back to email when the name fields are blank).
 *
 * Routed through the IDENTITY HTTP link in `TimeProjectApolloClient` via
 * `context: { clientName: ApolloClientNames.IDENTITY }`.
 */
export const GET_IDENTITY_PROFILE = gql`
  query TimeProjectGetIdentityProfile($input: GetProfileInput!) {
    profile(input: $input) {
      personInfo {
        contactInfo {
          emails {
            email
          }
        }
        name {
          familyName
          fullName
          givenName
        }
      }
    }
  }
`;
