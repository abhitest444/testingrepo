import { ApolloError } from '@apollo/client';

/**
 * GraphQL error object structure from the errors array
 * Based on GraphQL spec: https://spec.graphql.org/October2021/#sec-Errors
 */
export interface GraphQLErrorObject {
  message: string;
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: Array<string | number>;
  extensions?: Record<string, any>; // Dynamic extension fields from backend
}

/**
 * Type for Apollo Client response that may contain GraphQL errors array
 * This handles both the standard response.error (Apollo-wrapped) and
 * response.errors[] (raw GraphQL errors array) patterns
 */
export type ResponseWithGraphQLErrors<T = unknown> = {
  data?: T;
  error?: ApolloError;
  errors?: Array<GraphQLErrorObject>;
};

/**
 * Checks if a response has any errors (response.error or errors[] array)
 * This handles both Apollo-wrapped errors and raw GraphQL errors
 *
 * @param response - Apollo Client response object
 * @returns true if any error exists (either response.error or response.errors[])
 */
export const hasAnyGraphQLError = <T>(
  response: ResponseWithGraphQLErrors<T>,
): boolean => {
  const hasErrorsArray = (response.errors?.length ?? 0) > 0;
  return !!(response.error || hasErrorsArray);
};

/**
 * Extracts error from response (either response.error or first error from errors[])
 * Returns error object suitable for error handling functions
 *
 * @param response - Apollo Client response object
 * @returns Error object or undefined if no error exists
 */
export const extractGraphQLError = <T>(
  response: ResponseWithGraphQLErrors<T>,
):
  | ApolloError
  | { message: string; graphQLErrors?: Array<GraphQLErrorObject>; name: string }
  | undefined => {
  if (response.error) {
    return response.error;
  }

  if ((response.errors?.length ?? 0) > 0) {
    return {
      message: response.errors![0].message,
      graphQLErrors: response.errors,
      name: 'GraphQLError',
    };
  }

  return undefined;
};
