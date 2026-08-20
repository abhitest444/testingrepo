import { act } from '@testing-library/react-hooks';
import { ApolloError } from '@apollo/client';
import {
  aTimeTracking_ManageCustomFieldsInput,
  aTimeTracking_ManageCustomFieldsPayload,
  aTimeTracking_ManageCustomFieldsError,
  aTimeTracking_CustomFieldDefinitionConnection,
} from '__mocks__/__generated__/timeTracking';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import { MANAGE_CUSTOM_FIELDS_MUTATION } from 'src/js/service/queries/timeTrackingQueries';
import {
  useManageCustomFields,
  UseManageCustomFieldsArgs,
} from 'src/js/service/hooks/timeEntries/useManageCustomFields';
import { TimeCustomerInteraction } from 'src/js/common/CustomerInteraction';

// Mock the customer interaction functions
jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn().mockReturnValue({}),
}));

// Mock the mapError utility
jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn(),
}));

describe('useManageCustomFields', () => {
  let args: UseManageCustomFieldsArgs;
  const mockInput = aTimeTracking_ManageCustomFieldsInput();

  beforeEach(() => {
    args = {
      onSuccess: jest.fn(),
      onError: jest.fn(),
    };
    jest.clearAllMocks();
    // Default mock behavior - return undefined when no error
    const { mapError } = require('src/js/service/utils/mapError');
    mapError.mockReturnValue(undefined);
  });

  it('should return the hook interface with manageCustomFields function, loading state, and error', () => {
    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(args),
      [],
    );

    expect(result.current.manageCustomFields).toBeDefined();
    expect(typeof result.current.manageCustomFields).toBe('function');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle successful mutation with payload response', async () => {
    const successMock = {
      request: {
        query: MANAGE_CUSTOM_FIELDS_MUTATION,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageCustomFields:
            aTimeTracking_ManageCustomFieldsPayload(),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(args),
      [successMock],
    );

    await act(async () => {
      await result.current.manageCustomFields(
        mockInput,
        TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      );
    });

    expect(args.onSuccess).toHaveBeenCalled();
    expect(args.onError).not.toHaveBeenCalled();
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
    );
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).not.toHaveBeenCalled();
  });

  it('should handle mutation error response', async () => {
    const errorMessage = 'Custom fields validation failed';
    const errorMock = {
      request: {
        query: MANAGE_CUSTOM_FIELDS_MUTATION,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageCustomFields: aTimeTracking_ManageCustomFieldsError(
            {
              message: errorMessage,
            },
          ),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(args),
      [errorMock],
    );

    await act(async () => {
      await result.current.manageCustomFields(
        mockInput,
        TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      );
    });

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith(errorMessage);
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      errorMessage,
    );
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).not.toHaveBeenCalled();
  });

  it('should handle mutation error response with default message when no message provided', async () => {
    const errorMock = {
      request: {
        query: MANAGE_CUSTOM_FIELDS_MUTATION,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageCustomFields: aTimeTracking_ManageCustomFieldsError(
            {
              message: undefined,
            },
          ),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(args),
      [errorMock],
    );

    await act(async () => {
      await result.current.manageCustomFields(
        mockInput,
        TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      );
    });

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith(
      'Failed to mark custom field as required',
    );
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      'Failed to mark custom field as required',
    );
  });

  it('should handle network/exception errors', async () => {
    const networkErrorMock = {
      request: {
        query: MANAGE_CUSTOM_FIELDS_MUTATION,
        variables: { input: mockInput },
      },
      error: new ApolloError({ errorMessage: 'Network error occurred' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(args),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current.manageCustomFields(
        mockInput,
        TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      );
    });

    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(args.onError).toHaveBeenCalledWith(
      'An unexpected error occurred while modifying custom fields',
    );
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      'An unexpected error occurred while modifying custom fields',
    );
  });

  it('should handle null data response gracefully', async () => {
    const nullDataMock = {
      request: {
        query: MANAGE_CUSTOM_FIELDS_MUTATION,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageCustomFields: null,
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(args),
      [nullDataMock],
    );

    await act(async () => {
      await result.current.manageCustomFields(
        mockInput,
        TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      );
    });

    expect(args.onSuccess).not.toHaveBeenCalled();
  });

  it('should work without optional callback functions', async () => {
    const successMock = {
      request: {
        query: MANAGE_CUSTOM_FIELDS_MUTATION,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageCustomFields:
            aTimeTracking_ManageCustomFieldsPayload(),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(),
      [successMock],
    );

    await act(async () => {
      await result.current.manageCustomFields(
        mockInput,
        TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      );
    });

    // Should not throw errors when callbacks are not provided
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
    );
  });

  it('should handle error without optional callback functions', async () => {
    const errorMock = {
      request: {
        query: MANAGE_CUSTOM_FIELDS_MUTATION,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageCustomFields: aTimeTracking_ManageCustomFieldsError(
            {
              message: 'Test error',
            },
          ),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(),
      [errorMock],
    );

    await act(async () => {
      await result.current.manageCustomFields(
        mockInput,
        TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      );
    });

    // Should not throw errors when callbacks are not provided
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      'Test error',
    );
  });

  it('should return loading state during mutation execution', async () => {
    const successMock = {
      request: {
        query: MANAGE_CUSTOM_FIELDS_MUTATION,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageCustomFields:
            aTimeTracking_ManageCustomFieldsPayload(),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(args),
      [successMock],
    );

    // Initially not loading
    expect(result.current.loading).toBe(false);

    // Start the mutation
    const mutationPromise = act(async () => {
      await result.current.manageCustomFields(
        mockInput,
        TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      );
    });

    // Should be loading during execution
    expect(result.current.loading).toBe(true);

    await mutationPromise;

    // Should not be loading after completion
    expect(result.current.loading).toBe(false);
  });

  it('should handle custom field input with multiple fields', async () => {
    const customInput = aTimeTracking_ManageCustomFieldsInput({
      fields: [
        {
          id: 'field-1',
          name: 'Test Field 1',
          required: true,
        },
        {
          id: 'field-2',
          name: 'Test Field 2',
          required: false,
        },
      ],
    });

    const successMock = {
      request: {
        query: MANAGE_CUSTOM_FIELDS_MUTATION,
        variables: { input: customInput },
      },
      result: {
        data: {
          timeTrackingManageCustomFields:
            aTimeTracking_ManageCustomFieldsPayload({
              customFields: aTimeTracking_CustomFieldDefinitionConnection(),
            }),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(args),
      [successMock],
    );

    await act(async () => {
      await result.current.manageCustomFields(
        customInput,
        TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      );
    });

    expect(args.onSuccess).toHaveBeenCalled();
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).toHaveBeenCalledWith(
      expect.any(Object),
      TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
    );
  });

  it('should map error correctly when GraphQL error occurs', async () => {
    const { mapError } = require('src/js/service/utils/mapError');

    const errorMock = {
      request: {
        query: MANAGE_CUSTOM_FIELDS_MUTATION,
        variables: { input: mockInput },
      },
      error: new ApolloError({ errorMessage: 'GraphQL error' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(args),
      [errorMock],
    );

    await act(async () => {
      await result.current.manageCustomFields(
        mockInput,
        TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      );
    });

    expect(mapError).toHaveBeenCalledWith({
      sourceComponent: 'useManageCustomFields',
      sandbox: expect.any(Object),
      intl: expect.any(Object),
      error: expect.any(ApolloError),
    });
  });

  it('should handle when result.data is null (undefined __typename)', async () => {
    const nullDataMock = {
      request: {
        query: MANAGE_CUSTOM_FIELDS_MUTATION,
        variables: { input: mockInput },
      },
      result: {
        data: null,
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(args),
      [nullDataMock],
    );

    await act(async () => {
      await result.current.manageCustomFields(
        mockInput,
        TimeCustomerInteraction.CUSTOM_FIELDS_REQUIRED_UPDATE,
      );
    });

    // Neither success nor error should be called when data is null
    expect(args.onSuccess).not.toHaveBeenCalled();
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).not.toHaveBeenCalled();
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).not.toHaveBeenCalled();
  });

  it('should not call endInteractionWithSuccess when interactionName is omitted on success', async () => {
    const successMock = {
      request: {
        query: MANAGE_CUSTOM_FIELDS_MUTATION,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageCustomFields:
            aTimeTracking_ManageCustomFieldsPayload(),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(args),
      [successMock],
    );

    await act(async () => {
      // No interactionName passed
      await result.current.manageCustomFields(mockInput);
    });

    expect(args.onSuccess).toHaveBeenCalled();
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithSuccess,
    ).not.toHaveBeenCalled();
  });

  it('should not call endInteractionWithFailure when interactionName is omitted on error response', async () => {
    const errorMessage = 'Some error';
    const errorMock = {
      request: {
        query: MANAGE_CUSTOM_FIELDS_MUTATION,
        variables: { input: mockInput },
      },
      result: {
        data: {
          timeTrackingManageCustomFields: aTimeTracking_ManageCustomFieldsError(
            {
              message: errorMessage,
            },
          ),
        },
      },
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(args),
      [errorMock],
    );

    await act(async () => {
      await result.current.manageCustomFields(mockInput);
    });

    expect(args.onError).toHaveBeenCalledWith(errorMessage);
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).not.toHaveBeenCalled();
  });

  it('should not call endInteractionWithFailure when interactionName is omitted on network error', async () => {
    const networkErrorMock = {
      request: {
        query: MANAGE_CUSTOM_FIELDS_MUTATION,
        variables: { input: mockInput },
      },
      error: new ApolloError({ errorMessage: 'Network failure' }),
    };

    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(args),
      [networkErrorMock],
    );

    await act(async () => {
      await result.current.manageCustomFields(mockInput);
    });

    expect(args.onError).toHaveBeenCalledWith(
      'An unexpected error occurred while modifying custom fields',
    );
    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).not.toHaveBeenCalled();
  });

  it('should not throw when onError is absent and network error occurs without interactionName', async () => {
    const networkErrorMock = {
      request: {
        query: MANAGE_CUSTOM_FIELDS_MUTATION,
        variables: { input: mockInput },
      },
      error: new ApolloError({ errorMessage: 'Network failure no cb' }),
    };

    // No callbacks, no interactionName — hits the onError?.() null branch in catch
    const { result } = renderHookWithApolloProvider(
      () => useManageCustomFields(),
      [networkErrorMock],
    );

    await act(async () => {
      // No interactionName — skips the if(interactionName) block, then hits onError?.() with undefined
      await result.current.manageCustomFields(mockInput);
    });

    expect(
      require('src/js/common/CustomerInteraction').endInteractionWithFailure,
    ).not.toHaveBeenCalled();
  });
});
