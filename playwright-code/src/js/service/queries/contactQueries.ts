import gql from 'graphql-tag';

// -------------------------------------------------------------------------------------------------- QUERY
export const VendorByIdQuery = gql`
  query getVendorById($id: ID!) {
    node(id: $id) {
      id
      ...VendorFragment
    }
  }

  fragment VendorFragment on Network_Contact {
    displayName
    entityVersion
    externalIds {
      localId
      namespaceId
    }
    profiles {
      vendor {
        jobCosting {
          billRate
          costRate
        }
      }
    }
  }
`;

interface JobCosting {
  billRate: string;
  costRate: string;
}

interface ExternalId {
  localId: string;
  namespaceId: string;
}

interface VendorContact {
  id: string;
  displayName: string;
  entityVersion: string;
  externalIds: ExternalId[];
  profiles: {
    vendor: {
      jobCosting: JobCosting;
    };
  };
}

export interface VendorByIdQueryResponse {
  node: VendorContact;
}
