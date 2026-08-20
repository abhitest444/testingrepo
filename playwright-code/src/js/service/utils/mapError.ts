import { ApolloError } from '@apollo/client';

import { Sandbox } from 'src/js/common/sandbox';

// any noisy error messages can be added here:
export const NOISY_ERRORS = [
  'Response not successful: Received status code 401',
  'NetworkRequestError: Received HTTP status 401',
  'Exception while fetching data (/timeTrackingTimeEntry) : TIME_ACTIVITY_NOT_FOUND',
  'PERMISSION_DENIED',
  'Failed to fetch',
];

// any noisy status codes can be added here:
export const NOISY_STATUS_CODES = [401];

// returns true if the given error is considered noise
export const isErrorNoise = (error: string | ApolloError | Error) => {
  const errorMessage =
    error instanceof ApolloError || error instanceof Error
      ? error.message
      : error;

  // check for noisy error messages
  if (NOISY_ERRORS.includes(errorMessage)) {
    return true;
  }

  // check for noisy status codes in ApolloError
  if (
    error instanceof ApolloError &&
    error.networkError &&
    'statusCode' in error.networkError &&
    NOISY_STATUS_CODES.includes(error.networkError.statusCode)
  ) {
    return true;
  }

  // check for EntityNotFoundException from data-aggregation-service (e.g., Who's Working)
  // These errors occur when looking up contacts that don't exist and should be ignored
  if (error instanceof ApolloError) {
    const firstError = error.graphQLErrors?.at(0);
    if (
      firstError?.extensions?.className ===
        'com.intuit.ceres.data.access.core.exceptions.EntityNotFoundException' &&
      firstError?.extensions?.service === 'data-aggregation-service'
    ) {
      return true;
    }
  }

  // therefore this is not noise
  return false;
};

interface HandleErrorArgs {
  sourceComponent: string;
  sandbox: Sandbox;
  intl: any;
  error?: string | ApolloError | Error;
  customErrorHandler?: (errorMessage: string) => string;
}

export const mapError = ({
  sourceComponent,
  sandbox,
  intl,
  error,
  customErrorHandler,
}: HandleErrorArgs): string | undefined => {
  if (!error) return undefined;

  // if enabled, filter out any errors that are just noise
  const isNoise: boolean = isErrorNoise(error);

  const errorMessage =
    error instanceof ApolloError || error instanceof Error
      ? error.message
      : error;

  // if enabled, noisy errors will be logged as info instead of error
  sandbox.logger[isNoise ? 'info' : 'error'](
    `Event=TIME_TRACKING_UI_SERVICE_ERROR Component=${sourceComponent} Error="${error}" Message="${errorMessage}"`,
  );

  if (isNoise) {
    // whole screen stays empty without any failure message so returning general error.
    return intl.formatMessage({
      id: 'catch.all.error.content',
    });
  }

  // if provided, the customErrorHandler will be used
  if (customErrorHandler) {
    return customErrorHandler(errorMessage);
  }

  // defaults to returning a generic error message
  return intl.formatMessage({
    id: 'catch.all.error.content',
  });
};
