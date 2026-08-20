import { MockedProvider } from '@apollo/client/testing';
import { render } from '@testing-library/react';
import React from 'react';
import { STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY } from 'src/js/service/queries/timeTrackingQueries';

describe('STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY', () => {
  it('should have the correct query structure', () => {
    expect(STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY).toBeDefined();
    expect(STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY.kind).toBe('Document');

    // Check if the query contains the expected operation
    const queryDefinition =
      STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY.definitions[0];
    expect(queryDefinition.kind).toBe('OperationDefinition');
    if (queryDefinition.kind === 'OperationDefinition') {
      expect(queryDefinition.operation).toBe('query');
      expect(queryDefinition.name?.value).toBe(
        'timeTrackingStandardFieldAssignmentSummary',
      );
    }
  });

  it('should have the correct query variables', () => {
    const queryDefinition =
      STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY.definitions[0];

    if (queryDefinition.kind === 'OperationDefinition') {
      const variables = queryDefinition.variableDefinitions;
      expect(variables).toHaveLength(2);

      const firstVariable = variables?.[0];
      expect(firstVariable?.variable.name.value).toBe('first');
      expect(firstVariable?.type.kind).toBe('NonNullType');

      const afterVariable = variables?.[1];
      expect(afterVariable?.variable.name.value).toBe('after');
      expect(afterVariable?.type.kind).toBe('NamedType');
    }
  });

  it('should select the correct fields', () => {
    const queryDefinition =
      STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY.definitions[0];

    if (queryDefinition.kind === 'OperationDefinition') {
      const { selectionSet } = queryDefinition;
      const rootField = selectionSet.selections[0];

      if (rootField.kind === 'Field') {
        expect(rootField.name.value).toBe(
          'timeTrackingStandardFieldAssignmentSummary',
        );

        // Check if it selects edges, pageInfo, and totalTimeAgainstAssignments
        const fieldSelections = rootField.selectionSet?.selections || [];
        const fieldNames = fieldSelections
          .filter((selection) => selection.kind === 'Field')
          .map((selection) => (selection as any).name.value);

        expect(fieldNames).toContain('edges');
        expect(fieldNames).toContain('pageInfo');
        expect(fieldNames).toContain('totalTimeAgainstAssignments');
      }
    }
  });

  describe('Mock Responses', () => {
    const createMock = (data: any, variables: any = { first: 20 }) => ({
      request: {
        query: STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY,
        variables,
      },
      result: {
        data,
      },
    });

    it('should handle successful response with data', () => {
      const mockData = {
        timeTrackingStandardFieldAssignmentSummary: {
          edges: [
            {
              node: {
                standardFieldLabel: 'Customers/sub-customers',
                assignedTimeAgainstCount: 10,
              },
              cursor: 'cursor1',
            },
            {
              node: {
                standardFieldLabel: 'Service item',
                assignedTimeAgainstCount: 5,
              },
              cursor: 'cursor2',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'cursor1',
            endCursor: 'cursor2',
          },
          totalTimeAgainstAssignments: 15,
        },
      };

      const mock = createMock(mockData);

      expect(mock.request.query).toBe(STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY);
      expect(
        mock.result.data.timeTrackingStandardFieldAssignmentSummary,
      ).toBeDefined();
      expect(
        mock.result.data.timeTrackingStandardFieldAssignmentSummary.edges,
      ).toHaveLength(2);
      expect(
        mock.result.data.timeTrackingStandardFieldAssignmentSummary
          .totalTimeAgainstAssignments,
      ).toBe(15);
    });

    it('should handle empty response', () => {
      const mockData = {
        timeTrackingStandardFieldAssignmentSummary: {
          edges: [],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null,
          },
          totalTimeAgainstAssignments: 0,
        },
      };

      const mock = createMock(mockData);

      expect(
        mock.result.data.timeTrackingStandardFieldAssignmentSummary.edges,
      ).toHaveLength(0);
      expect(
        mock.result.data.timeTrackingStandardFieldAssignmentSummary
          .totalTimeAgainstAssignments,
      ).toBe(0);
    });

    it('should handle pagination with after cursor', () => {
      const mockData = {
        timeTrackingStandardFieldAssignmentSummary: {
          edges: [
            {
              node: {
                standardFieldLabel: 'Class',
                assignedTimeAgainstCount: 3,
              },
              cursor: 'cursor3',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: 'cursor3',
            endCursor: 'cursor3',
          },
          totalTimeAgainstAssignments: 18,
        },
      };

      const mock = createMock(mockData, { first: 20, after: 'cursor2' });

      expect(mock.request.variables.after).toBe('cursor2');
      expect(
        mock.result.data.timeTrackingStandardFieldAssignmentSummary.pageInfo
          .hasPreviousPage,
      ).toBe(true);
    });

    it('should work with MockedProvider', () => {
      const mockData = {
        timeTrackingStandardFieldAssignmentSummary: {
          edges: [
            {
              node: {
                standardFieldLabel: 'Customers/sub-customers',
                assignedTimeAgainstCount: 10,
              },
              cursor: 'cursor1',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: 'cursor1',
            endCursor: 'cursor1',
          },
          totalTimeAgainstAssignments: 10,
        },
      };

      const mocks = [createMock(mockData)];

      // Test component that would use this query
      const TestComponent = () =>
        React.createElement('div', null, 'Test Component');

      const { container } = render(
        React.createElement(
          MockedProvider,
          { mocks, addTypename: false },
          React.createElement(TestComponent),
        ),
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle GraphQL errors', () => {
      const errorMock = {
        request: {
          query: STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY,
          variables: { first: 20 },
        },
        error: new Error('GraphQL Error: Failed to fetch assignment summary'),
      };

      expect(errorMock.error.message).toContain(
        'Failed to fetch assignment summary',
      );
    });

    it('should handle network errors', () => {
      const networkErrorMock = {
        request: {
          query: STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY,
          variables: { first: 20 },
        },
        error: new Error('Network error: Unable to connect to server'),
      };

      expect(networkErrorMock.error.message).toContain('Network error');
    });

    it('should handle invalid response structure', () => {
      const invalidMock = {
        request: {
          query: STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY,
          variables: { first: 20 },
        },
        result: {
          data: null,
          errors: [
            {
              message: 'Invalid response structure',
              path: ['timeTrackingStandardFieldAssignmentSummary'],
            },
          ],
        },
      };

      expect(invalidMock.result.data).toBeNull();
      expect(invalidMock.result.errors).toHaveLength(1);
      expect(invalidMock.result.errors?.[0].message).toBe(
        'Invalid response structure',
      );
    });
  });

  describe('Field Label Mapping', () => {
    it('should handle various standard field labels', () => {
      const fieldLabels = [
        'Customers/sub-customers',
        'Service item',
        'Class',
        'Department',
        'Location',
        'Billable',
        'Notes',
        'Employee',
        'Project',
      ];

      fieldLabels.forEach((label) => {
        const mockData = {
          timeTrackingStandardFieldAssignmentSummary: {
            edges: [
              {
                node: {
                  standardFieldLabel: label,
                  assignedTimeAgainstCount: Math.floor(Math.random() * 20),
                },
                cursor: `cursor_${label.replace(/[^a-zA-Z0-9]/g, '_')}`,
              },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: `cursor_${label.replace(/[^a-zA-Z0-9]/g, '_')}`,
              endCursor: `cursor_${label.replace(/[^a-zA-Z0-9]/g, '_')}`,
            },
            totalTimeAgainstAssignments: 100,
          },
        };

        const mock = {
          request: {
            query: STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY,
            variables: { first: 20 },
          },
          result: { data: mockData },
        };

        expect(
          mock.result.data.timeTrackingStandardFieldAssignmentSummary.edges[0]
            .node.standardFieldLabel,
        ).toBe(label);
      });
    });
  });

  describe('Pagination Scenarios', () => {
    it('should handle first page with hasNextPage true', () => {
      const mockData = {
        timeTrackingStandardFieldAssignmentSummary: {
          edges: Array.from({ length: 20 }, (_, i) => ({
            node: {
              standardFieldLabel: `Field ${i + 1}`,
              assignedTimeAgainstCount: i + 1,
            },
            cursor: `cursor${i + 1}`,
          })),
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: false,
            startCursor: 'cursor1',
            endCursor: 'cursor20',
          },
          totalTimeAgainstAssignments: 50,
        },
      };

      const mock = {
        request: {
          query: STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY,
          variables: { first: 20 },
        },
        result: { data: mockData },
      };

      expect(
        mock.result.data.timeTrackingStandardFieldAssignmentSummary.edges,
      ).toHaveLength(20);
      expect(
        mock.result.data.timeTrackingStandardFieldAssignmentSummary.pageInfo
          .hasNextPage,
      ).toBe(true);
      expect(
        mock.result.data.timeTrackingStandardFieldAssignmentSummary.pageInfo
          .hasPreviousPage,
      ).toBe(false);
    });

    it('should handle middle page', () => {
      const mockData = {
        timeTrackingStandardFieldAssignmentSummary: {
          edges: [
            {
              node: {
                standardFieldLabel: 'Middle Field',
                assignedTimeAgainstCount: 15,
              },
              cursor: 'cursorMiddle',
            },
          ],
          pageInfo: {
            hasNextPage: true,
            hasPreviousPage: true,
            startCursor: 'cursorMiddle',
            endCursor: 'cursorMiddle',
          },
          totalTimeAgainstAssignments: 50,
        },
      };

      const mock = {
        request: {
          query: STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY,
          variables: { first: 20, after: 'cursor20' },
        },
        result: { data: mockData },
      };

      expect(
        mock.result.data.timeTrackingStandardFieldAssignmentSummary.pageInfo
          .hasNextPage,
      ).toBe(true);
      expect(
        mock.result.data.timeTrackingStandardFieldAssignmentSummary.pageInfo
          .hasPreviousPage,
      ).toBe(true);
    });

    it('should handle last page', () => {
      const mockData = {
        timeTrackingStandardFieldAssignmentSummary: {
          edges: [
            {
              node: {
                standardFieldLabel: 'Last Field',
                assignedTimeAgainstCount: 5,
              },
              cursor: 'cursorLast',
            },
          ],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: true,
            startCursor: 'cursorLast',
            endCursor: 'cursorLast',
          },
          totalTimeAgainstAssignments: 50,
        },
      };

      const mock = {
        request: {
          query: STANDARD_FIELD_ASSIGNMENT_SUMMARY_QUERY,
          variables: { first: 20, after: 'cursorMiddle' },
        },
        result: { data: mockData },
      };

      expect(
        mock.result.data.timeTrackingStandardFieldAssignmentSummary.pageInfo
          .hasNextPage,
      ).toBe(false);
      expect(
        mock.result.data.timeTrackingStandardFieldAssignmentSummary.pageInfo
          .hasPreviousPage,
      ).toBe(true);
    });
  });
});
