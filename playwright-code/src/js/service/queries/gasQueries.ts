/* eslint-disable no-unused-expressions */

import gql from 'graphql-tag';

export const GET_EMPLOYEES_BY_ID_QUERY = gql`
  query getEmployeeDataForTimeEntries(
    $employeeIdFilter: IDFilter
    $pagination: PaginationInput
    $employeeSortInput: EmployeeConnectionOrderBy
  ) {
    company {
      __typename
      id
      employees(
        filterBy: { employeeId: $employeeIdFilter }
        pagination: $pagination
        sortBy: $employeeSortInput
      ) {
        __typename
        edges {
          __typename
          node {
            __typename
            id
            displayName
            externalIds {
              localId
              realmId
              namespaceId
            }
            employmentDetail {
              jobCosting {
                costRate
                billRate
              }
            }
          }
        }
      }
    }
  }
`;

gql`
  query getFilteredWageItemsDataForTimeEntries(
    $filterBy: EmployerCompensationsFilter
  ) {
    company {
      id
      companyInfo {
        id
        employerInfo {
          employerCompensations(filterBy: $filterBy) {
            id
            name
            type
            active
            __typename
          }
          __typename
        }
        __typename
      }
      __typename
    }
  }
`;

export const GET_EMPLOYEE_BY_ID = gql`
  query getEmployeeById(
    $employeeId: ID!
    $shouldFetchTimeOffPolicies: Boolean!
  ) {
    company {
      id
      __typename
      employee(id: $employeeId) {
        id
        displayName
        externalIds {
          localId
          realmId
          namespaceId
        }
        employmentDetail {
          jobCosting {
            costRate
            billRate
            billable
          }
        }
        timeOffPolicies @include(if: $shouldFetchTimeOffPolicies) {
          employerTimeOffPolicy {
            timeOffMethod
          }
        }
      }
    }
  }
`;

export const GET_EMPLOYEE_BY_USER_ID = gql`
  query WorkersByUserId($input: WorkerInput) {
    workersByUserId(input: $input) {
      id
      ... on Employee {
        externalIds {
          localId
          namespaceId
          realmId
        }
      }
    }
  }
`;
