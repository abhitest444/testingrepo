import gql from 'graphql-tag';

export const GET_TIMESHEET_FIELDS_DATA = gql`
  query getTimesheetFieldsData($first: PositiveInt!, $offset: Int) {
    dataAccessContacts(
      offset: $offset
      first: $first
      filter: {
        or: [
          {
            and: [
              { type: { matchesAny: [CUSTOMER] } }
              { customerType: { matchesAny: [CUSTOMER, PROJECT] } }
              { active: { equals: true } }
            ]
          }
        ]
      }
      orderBy: [TYPE_ASC, FULL_NAME_ASC]
    ) {
      totalCount
      edges {
        node {
          id
          type
          firstName
          lastName
          fullName
          displayName
        }
      }
    }

    dataAccessProducts(
      offset: $offset
      first: $first
      filter: { or: [{ and: [{ active: { equals: true } }] }] }
      orderBy: [FULL_NAME_ASC]
    ) {
      totalCount
      edges {
        node {
          id
          fullName
          saleDetails {
            price
            description
          }
        }
      }
    }

    dataAccessKlasses(
      offset: $offset
      first: $first
      filter: { or: [{ and: [{ active: { equals: true } }] }] }
      orderBy: [FULL_NAME_ASC]
    ) {
      totalCount
      edges {
        node {
          id
          fullName
          name
        }
      }
    }

    dataAccessDepartments(
      offset: $offset
      first: $first
      filter: { or: [{ and: [{ active: { equals: true } }] }] }
      orderBy: [FULL_NAME_ASC]
    ) {
      edges {
        node {
          id
          fullName
        }
      }
      totalCount
    }
  }
`;
