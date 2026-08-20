import { gql } from '@apollo/client';

// Fragments for reusable fields
export const BREAK_ASSIGNMENT_FRAGMENT = gql`
  fragment BreakAssignmentFields on Payroll_BreakAssignment {
    id
    breakPolicyId
    assignmentType
    assigneeId
    isActive
  }
`;

export const MANUAL_BREAK_RULE_FRAGMENT = gql`
  fragment ManualBreakRuleFields on Payroll_ManualBreakRule {
    autoEndBreak
    allowEarlyEndBreak
    breakEndingReminder
    breakEndingReminderTime
    durationUnit
  }
`;

export const AUTO_BREAK_RULE_FRAGMENT = gql`
  fragment AutoBreakRuleFields on Payroll_AutoBreakRule {
    shiftThresholdLimit
    durationUnit
    repeatBreak
    breakPosition
    specificTime
    workDays
  }
`;

export const EMPLOYER_BREAK_FRAGMENT = gql`
  fragment EmployerBreakFields on Payroll_EmployerBreak {
    id
    breakName
    isActive
    breakType
    allowManual
    allowAuto
    noSetDuration
    breakDuration
    durationUnit
    isDeleted
    isDefaultPolicy
    activeBreakAssignmentCount
    manualRule {
      ...ManualBreakRuleFields
    }
    autoRule {
      ...AutoBreakRuleFields
    }
  }
  ${MANUAL_BREAK_RULE_FRAGMENT}
  ${AUTO_BREAK_RULE_FRAGMENT}
`;

// Queries
export const GET_BREAK_ASSIGNMENTS = gql`
  query GetBreakAssignments(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $filter: Payroll_BreakAssignmentFilter
  ) {
    payrollBreakAssignments(
      first: $first
      after: $after
      last: $last
      before: $before
      filter: $filter
    ) {
      edges {
        cursor
        node {
          ...BreakAssignmentFields
        }
      }
      nodes {
        ...BreakAssignmentFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${BREAK_ASSIGNMENT_FRAGMENT}
`;

export const GET_EMPLOYER_BREAKS = gql`
  query GetEmployerBreaks(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $filter: Payroll_EmployerBreakFilter
  ) {
    payrollEmployerBreaks(
      first: $first
      after: $after
      last: $last
      before: $before
      filter: $filter
    ) {
      edges {
        cursor
        node {
          ...EmployerBreakFields
        }
      }
      nodes {
        ...EmployerBreakFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${EMPLOYER_BREAK_FRAGMENT}
`;

export const GET_EMPLOYER_BREAKS_BY_ASSIGNEE = gql`
  query GetEmployerBreaksByAssignee(
    $first: Int
    $after: String
    $last: Int
    $before: String
    $filter: Payroll_EmployerBreakByAssigneeIdFilter
  ) {
    payrollEmployerBreaksByAssigneeId(
      first: $first
      after: $after
      last: $last
      before: $before
      filter: $filter
    ) {
      edges {
        cursor
        node {
          ...EmployerBreakFields
        }
      }
      nodes {
        ...EmployerBreakFields
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
  ${EMPLOYER_BREAK_FRAGMENT}
`;

// Mutations
export const CREATE_EMPLOYER_BREAK = gql`
  mutation CreateEmployerBreak($input: Payroll_CreateEmployerBreakInput!) {
    payrollCreateEmployerBreak(input: $input) {
      ... on Payroll_CreateEmployerBreakSuccess {
        breakRule {
          ...EmployerBreakFields
        }
      }
      ... on Payroll_EmployerBreakError {
        code
        type
        message
        breakRuleId
      }
    }
  }
  ${EMPLOYER_BREAK_FRAGMENT}
`;

export const UPDATE_EMPLOYER_BREAK = gql`
  mutation UpdateEmployerBreak($input: Payroll_UpdateEmployerBreakInput!) {
    payrollUpdateEmployerBreak(input: $input) {
      ... on Payroll_UpdateEmployerBreakSuccess {
        breakRule {
          ...EmployerBreakFields
        }
      }
      ... on Payroll_EmployerBreakError {
        code
        type
        message
        breakRuleId
      }
    }
  }
  ${EMPLOYER_BREAK_FRAGMENT}
`;

export const DELETE_EMPLOYER_BREAK = gql`
  mutation DeleteEmployerBreak($input: Payroll_DeleteEmployerBreakInput!) {
    payrollDeleteEmployerBreak(input: $input) {
      ... on Payroll_DeleteEmployerBreakSuccess {
        success
      }
      ... on Payroll_EmployerBreakError {
        code
        type
        message
        breakRuleId
      }
    }
  }
`;

export const CREATE_BREAK_ASSIGNMENT = gql`
  mutation CreateBreakAssignment($input: Payroll_CreateBreakAssignmentInput!) {
    payrollCreateBreakAssignment(input: $input) {
      __typename
      ... on Payroll_BreakAssignmentResult {
        results {
          __typename
          ... on Payroll_CreateBreakAssignmentSuccess {
            breakAssignment {
              ...BreakAssignmentFields
            }
          }
          ... on Payroll_BreakAssignmentAssigneeError {
            code
            type
            message
            assigneeId
          }
        }
      }
      ... on Payroll_BreakAssignmentError {
        code
        type
        message
      }
    }
  }
  ${BREAK_ASSIGNMENT_FRAGMENT}
`;
