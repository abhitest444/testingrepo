import { ApolloError, ServerError } from '@apollo/client';
import { GraphQLError } from 'graphql';
import { mapError, isErrorNoise } from 'src/js/service/utils/mapError';
import { Sandbox } from 'src/js/common/sandbox';

describe('mapError function', () => {
  let sandbox: Sandbox;
  let intl: any;

  beforeEach(() => {
    sandbox = {
      logger: {
        error: jest.fn(),
        info: jest.fn(),
      },
    } as unknown as Sandbox;

    intl = {
      formatMessage: jest.fn().mockReturnValue('Formatted error message'),
    };
  });

  it('should return undefined if no error is provided', () => {
    const result = mapError({
      sourceComponent: 'TestComponent',
      sandbox,
      intl,
    });

    expect(result).toBeUndefined();
    expect(sandbox.logger.error).not.toHaveBeenCalled();
  });

  it('should log and return formatted message for ApolloError', () => {
    const error = new ApolloError({ errorMessage: 'Apollo error occurred' });

    const result = mapError({
      sourceComponent: 'TestComponent',
      sandbox,
      intl,
      error,
    });

    expect(result).toEqual('Formatted error message');
    expect(sandbox.logger.error).toHaveBeenCalledWith(
      'Event=TIME_TRACKING_UI_SERVICE_ERROR Component=TestComponent Error="ApolloError: Apollo error occurred" Message="Apollo error occurred"',
    );
    expect(intl.formatMessage).toHaveBeenCalledWith({
      id: 'catch.all.error.content',
    });
  });

  it('should log and return formatted message for generic Error', () => {
    const error = new Error('Generic error occurred');

    const result = mapError({
      sourceComponent: 'TestComponent',
      sandbox,
      intl,
      error,
    });

    expect(result).toEqual('Formatted error message');
    expect(sandbox.logger.error).toHaveBeenCalledWith(
      'Event=TIME_TRACKING_UI_SERVICE_ERROR Component=TestComponent Error="Error: Generic error occurred" Message="Generic error occurred"',
    );
    expect(intl.formatMessage).toHaveBeenCalledWith({
      id: 'catch.all.error.content',
    });
  });

  it('should log and return formatted message for string error', () => {
    const error = 'String error occurred';

    const result = mapError({
      sourceComponent: 'TestComponent',
      sandbox,
      intl,
      error,
    });

    expect(result).toEqual('Formatted error message');
    expect(sandbox.logger.error).toHaveBeenCalledWith(
      'Event=TIME_TRACKING_UI_SERVICE_ERROR Component=TestComponent Error="String error occurred" Message="String error occurred"',
    );
    expect(intl.formatMessage).toHaveBeenCalledWith({
      id: 'catch.all.error.content',
    });
  });

  it('should use custom error handler if provided', () => {
    const error = 'Custom error occurred';
    const customErrorHandler = jest
      .fn()
      .mockReturnValue('Custom handled error');

    const result = mapError({
      sourceComponent: 'TestComponent',
      sandbox,
      intl,
      error,
      customErrorHandler,
    });

    expect(result).toEqual('Custom handled error');
    expect(customErrorHandler).toHaveBeenCalledWith('Custom error occurred');
    expect(sandbox.logger.error).toHaveBeenCalledWith(
      'Event=TIME_TRACKING_UI_SERVICE_ERROR Component=TestComponent Error="Custom error occurred" Message="Custom error occurred"',
    );
  });

  describe('filtering noise', () => {
    it('should not return an error if the error string is on the noisy list', () => {
      // given there is a 401 error
      const result = mapError({
        error: 'Response not successful: Received status code 401',
        intl,
        sandbox,
        sourceComponent: 'TestComponent',
      });
      expect(result).toEqual('Formatted error message');
      // and an info message is logged
      expect(sandbox.logger.error).not.toHaveBeenCalled();
      expect(sandbox.logger.info).toHaveBeenCalledWith(
        'Event=TIME_TRACKING_UI_SERVICE_ERROR Component=TestComponent Error="Response not successful: Received status code 401" Message="Response not successful: Received status code 401"',
      );
    });

    it('should not return an error if the error message is on the noisy list', () => {
      // given there is a 401 error
      const result = mapError({
        error: new Error('Response not successful: Received status code 401'),
        intl,
        sandbox,
        sourceComponent: 'TestComponent',
      });
      expect(result).toEqual('Formatted error message');
      // and an info message is logged
      expect(sandbox.logger.error).not.toHaveBeenCalled();
      expect(sandbox.logger.info).toHaveBeenCalledWith(
        'Event=TIME_TRACKING_UI_SERVICE_ERROR Component=TestComponent Error="Error: Response not successful: Received status code 401" Message="Response not successful: Received status code 401"',
      );
    });

    it('should not return an error if the statusCode is 401', () => {
      // given there is a 401 error
      const result = mapError({
        error: new ApolloError({
          errorMessage: 'Oh snap!',
          networkError: { statusCode: 401 } as ServerError,
        }),
        intl,
        sandbox,
        sourceComponent: 'TestComponent',
      });
      expect(result).toEqual('Formatted error message');
      // and an info message is logged
      expect(sandbox.logger.error).not.toHaveBeenCalled();
      expect(sandbox.logger.info).toHaveBeenCalledWith(
        'Event=TIME_TRACKING_UI_SERVICE_ERROR Component=TestComponent Error="ApolloError: Oh snap!" Message="Oh snap!"',
      );
    });

    it('should return an error if the error is not noise ', () => {
      // given there is a 500 error
      const result = mapError({
        error: new ApolloError({
          errorMessage: 'Oh snap!',
          networkError: { statusCode: 500 } as ServerError,
        }),
        intl,
        sandbox,
        sourceComponent: 'TestComponent',
      });
      // then an error is returned
      expect(result).toEqual('Formatted error message');
      // and an error message is logged
      expect(sandbox.logger.info).not.toHaveBeenCalled();
      expect(sandbox.logger.error).toHaveBeenCalledWith(
        'Event=TIME_TRACKING_UI_SERVICE_ERROR Component=TestComponent Error="ApolloError: Oh snap!" Message="Oh snap!"',
      );
    });
  });
});

describe('isErrorNoise function', () => {
  it('should return true for EntityNotFoundException from data-aggregation-service', () => {
    const graphQLError = new GraphQLError('Contact not found', {
      extensions: {
        className:
          'com.intuit.ceres.data.access.core.exceptions.EntityNotFoundException',
        service: 'data-aggregation-service',
      },
    });

    const apolloError = new ApolloError({
      graphQLErrors: [graphQLError],
    });

    expect(isErrorNoise(apolloError)).toBe(true);
  });

  it('should return false for EntityNotFoundException from other services', () => {
    const graphQLError = new GraphQLError('Entity not found', {
      extensions: {
        className:
          'com.intuit.ceres.data.access.core.exceptions.EntityNotFoundException',
        service: 'some-other-service',
      },
    });

    const apolloError = new ApolloError({
      graphQLErrors: [graphQLError],
    });

    expect(isErrorNoise(apolloError)).toBe(false);
  });

  it('should return false for other exception types from data-aggregation-service', () => {
    const graphQLError = new GraphQLError('Some other error', {
      extensions: {
        className: 'com.intuit.some.other.Exception',
        service: 'data-aggregation-service',
      },
    });

    const apolloError = new ApolloError({
      graphQLErrors: [graphQLError],
    });

    expect(isErrorNoise(apolloError)).toBe(false);
  });

  it('should return false for ApolloError without graphQLErrors', () => {
    const apolloError = new ApolloError({
      errorMessage: 'Network error',
    });

    expect(isErrorNoise(apolloError)).toBe(false);
  });

  it('should return true for noisy error messages', () => {
    expect(
      isErrorNoise('Response not successful: Received status code 401'),
    ).toBe(true);
    expect(isErrorNoise('NetworkRequestError: Received HTTP status 401')).toBe(
      true,
    );
    expect(isErrorNoise('Failed to fetch')).toBe(true);
  });

  it('should return false for non-noisy error messages', () => {
    expect(isErrorNoise('Some random error')).toBe(false);
  });
});
