import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { ApolloError } from '@apollo/client';
import {
  aTimeTracking_CustomFieldDefinition,
  aTimeTracking_CustomFieldDefinitionConnection,
} from '__mocks__/__generated__/timeTracking';

import {
  useGetCustomFields,
  mapCustomFields,
} from 'src/js/service/hooks/timeEntries/useGetCustomFields';

// Unmock the useGetCustomFields for its own tests
jest.unmock('src/js/service/hooks/timeEntries/useGetCustomFields');

// Mock the dependencies that the real implementation needs
jest.mock('@payroll/quicksand', () => ({
  useIntl: jest.fn(() => ({})),
  useSandbox: jest.fn(() => ({
    logger: {
      info: jest.fn(),
      error: jest.fn(),
    },
  })),
}));

jest.mock('src/js/service/utils/mapError', () => ({
  mapError: jest.fn(() => undefined),
}));

// Mock the Apollo generated hook to avoid Apollo client setup issues
jest.mock('src/__generated__/timeTracking/graphql', () => ({
  ...jest.requireActual('src/__generated__/timeTracking/graphql'),
  useGetTimeTrackingCustomFieldsLazyQuery: jest.fn(() => [
    jest.fn(), // query function
    {
      data: undefined,
      loading: false,
      error: undefined,
    },
  ]),
}));

describe('useGetCustomFields', () => {
  const mockCustomFields = [
    aTimeTracking_CustomFieldDefinition({
      id: 'custom-field-1',
      name: 'Test Field 1',
      type: 'TEXT',
      deleted: false,
    }),
    aTimeTracking_CustomFieldDefinition({
      id: 'custom-field-2',
      name: 'Test Field 2',
      type: 'NUMBER',
      deleted: false,
    }),
  ];

  const mockCustomFieldsConnection =
    aTimeTracking_CustomFieldDefinitionConnection({
      edges: mockCustomFields.map((field) => ({
        node: field,
        cursor: `cursor-${field.id}`,
      })),
    });

  beforeEach(() => {
    // Setup for each test
  });

  describe('mapCustomFields', () => {
    it('should map GraphQL connection data to custom fields array', () => {
      const data = {
        timeTrackingCustomFields: mockCustomFieldsConnection,
      };

      const result = mapCustomFields(data);

      expect(result).toEqual(mockCustomFields);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('custom-field-1');
      expect(result[1].id).toBe('custom-field-2');
    });

    it('should return empty array when data is undefined', () => {
      const result = mapCustomFields(undefined);
      expect(result).toEqual([]);
    });

    it('should return empty array when timeTrackingCustomFields is undefined', () => {
      const data = {};
      const result = mapCustomFields(data);
      expect(result).toEqual([]);
    });

    it('should return empty array when edges is undefined', () => {
      const data = {
        timeTrackingCustomFields: {},
      };
      const result = mapCustomFields(data);
      expect(result).toEqual([]);
    });

    it('should handle empty edges array', () => {
      const data = {
        timeTrackingCustomFields: {
          edges: [],
        },
      };
      const result = mapCustomFields(data);
      expect(result).toEqual([]);
    });
  });

  describe('useGetCustomFields hook', () => {
    let mockLazyQuery: jest.Mock;

    beforeEach(() => {
      jest.clearAllMocks();
      const {
        useGetTimeTrackingCustomFieldsLazyQuery,
      } = require('src/__generated__/timeTracking/graphql');
      mockLazyQuery = useGetTimeTrackingCustomFieldsLazyQuery as jest.Mock;
    });

    it('should provide initial state correctly', () => {
      // Mock initial state
      mockLazyQuery.mockReturnValue([
        jest.fn(),
        { data: undefined, loading: false, error: undefined },
      ]);

      const { result } = renderHook(() => useGetCustomFields());

      // Verify the interface and initial values
      expect(result.current.customFields).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.query).toBeDefined();
      expect(typeof result.current.query).toBe('function');
    });

    it('should handle loading state', () => {
      // Mock loading state
      mockLazyQuery.mockReturnValue([
        jest.fn(),
        { data: undefined, loading: true, error: undefined },
      ]);

      const { result } = renderHook(() => useGetCustomFields());

      expect(result.current.customFields).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeUndefined();
    });

    it('should handle data and call mapCustomFields', () => {
      // Mock data state
      const mockData = {
        timeTrackingCustomFields: mockCustomFieldsConnection,
      };

      mockLazyQuery.mockReturnValue([
        jest.fn(),
        { data: mockData, loading: false, error: undefined },
      ]);

      const { result } = renderHook(() => useGetCustomFields());

      // Should transform data using mapCustomFields
      expect(result.current.customFields).toEqual(mockCustomFields);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
    });

    it('should handle errors properly', () => {
      // Mock error state
      const mockError = new Error('GraphQL Error');
      mockLazyQuery.mockReturnValue([
        jest.fn(),
        { data: undefined, loading: false, error: mockError },
      ]);

      const { result } = renderHook(() => useGetCustomFields());

      expect(result.current.customFields).toEqual([]);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined(); // mapError mock returns undefined
    });

    it('should configure Apollo lazy query with correct options', () => {
      mockLazyQuery.mockReturnValue([
        jest.fn(),
        { data: undefined, loading: false, error: undefined },
      ]);

      renderHook(() => useGetCustomFields());

      // Verify Apollo hook was called with correct configuration
      expect(mockLazyQuery).toHaveBeenCalledWith({
        context: {
          clientName: 2, // ApolloClientNames.TIME_TRACKING enum value
        },
        fetchPolicy: 'cache-and-network',
        notifyOnNetworkStatusChange: true,
        onCompleted: expect.any(Function),
        onError: expect.any(Function),
      });
    });
  });
});
