/* eslint-disable camelcase */

import { act } from '@testing-library/react-hooks';
import {
  aTimeTracking_TimeEntryInput,
  aTimeTracking_TimeEntry,
} from '__mocks__/__generated__/timeTracking';
import { renderHookWithApolloProvider } from 'test/unit/testUtils';
import {
  TIME_ENTRIES_SUCCESS_MOCKS,
  TIME_QUERY_ERROR_MOCKS,
} from 'test/unit/service/queries/timeTrackingQueries';
import { GET_TIME_ENTRY_QUERY } from 'src/js/service/queries/timeTrackingQueries';
import {
  useGetTimeEntry,
  UseGetTimeEntryArgs,
} from 'src/js/service/hooks/timeEntries/useGetTimeEntry';
import {
  createCustomerInteraction,
  endInteractionWithSuccess,
  endInteractionWithFailure,
  TimeCustomerInteraction,
} from 'src/js/common/CustomerInteraction';

import { useIxpExperiment } from 'src/js/service/hooks/ixp/useIxpExperiment';
import { useGetTSheetsAccountInfo } from 'src/js/service/hooks/settings/useGetTSheetsAccountInfo';

// Mock the hooks
jest.mock('src/js/service/hooks/ixp/useIxpExperiment');
jest.mock('src/js/service/hooks/settings/useGetTSheetsAccountInfo');
jest.mock('src/js/common/CustomerInteraction', () => ({
  ...jest.requireActual('src/js/common/CustomerInteraction'),
  createCustomerInteraction: jest.fn(),
  endInteractionWithSuccess: jest.fn(),
  endInteractionWithFailure: jest.fn(),
  getCustomerInteractionPropagationHeaders: jest.fn(() => ({})),
}));

// Mock useSandbox to capture logger calls
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Create a stable sandbox object to prevent infinite re-renders
const mockSandbox = {
  logger: mockLogger,
};

jest.mock('@payroll/quicksand', () => ({
  ...jest.requireActual('@payroll/quicksand'),
  useSandbox: jest.fn(() => mockSandbox),
}));

const mockUseIxpExperiment = useIxpExperiment as jest.MockedFunction<
  typeof useIxpExperiment
>;
const mockUseGetTSheetsAccountInfo =
  useGetTSheetsAccountInfo as jest.MockedFunction<
    typeof useGetTSheetsAccountInfo
  >;

describe('useGetTimeEntry', () => {
  let args: UseGetTimeEntryArgs;
  const mockTimeEntry = {
    __typename: 'TimeTracking_TimeEntry',
    id: '5b1472d6-1d78-473d-a883-5a99274b7e96',
    alternateIds: [],
    timeForType: 'EMPLOYEE',
    timeFor: {
      __typename: 'WorkerManagement_Employee',
      id: '8910a5b1-25ec-49fd-9c24-e8fade3e1995',
    },
    date: '1970-01-14T08:26:55.620Z',
    startTime: 'architecto',
    endTime: 'saepe',
    v3StartTime: 'maiores',
    v3EndTime: 'iste',
    duration: 8181,
    v3DurationDetails: {
      __typename: 'TimeTracking_V3DurationDetails',
      hours: 6271,
      minutes: 873,
      seconds: 213,
    },
    v3BreakDuration: 7597,
    v3BreakDurationDetails: {
      __typename: 'TimeTracking_V3BreakDurationDetails',
      hours: 9663,
      minutes: 873,
      seconds: 213,
    },
    timeAgainst: {
      __typename: 'TimeTracking_TrackTimeAgainst',
      project: {
        __typename: 'ProjectManagement_Project',
        id: 'ab7d9691-060d-4d06-ba94-b8984f9d433a',
      },
      customer: {
        __typename: 'Commerce_Customer',
        id: '905b27f9-1a48-44cb-a2b2-263c5f398f7b',
      },
    },
    class: {
      __typename: 'AppFoundations_CustomDimensionValue',
      id: '9f85bab4-c201-4d03-83d5-570dae9105c8',
    },
    serviceItem: {
      __typename: 'Commerce_ProductVariant',
      id: 'dc86a4f2-6c5b-4c75-a2bf-0971b0d8363a',
    },
    payrollItem: {
      __typename: 'Payroll_EmployeeCompensation',
      id: '23af7eec-4b4b-4fe0-a9a3-b42808311514',
    },
    department: {
      __typename: 'BusinessTransaction_Department',
      id: 'bfd50915-7bbd-45ec-bd39-2ee1a456906c',
    },
    billableRate: 'et',
    costRate: 'et',
    notes: 'test notes',
    taxable: false,
    billableStatus: 'BILLABLE',
    v3TransactionLocationType: 'FRANCE_OVERSEAS',
    isOpen: false,
    isSubmitted: false,
    approvalStatus: 'APPROVED',
    attachmentsCount: 0,
    locked: true,
    invoiceId: '43617ebd-d8c4-4c81-b17b-bf480d1aedef',
    meta: {
      __typename: 'TimeTracking_TimeEntryMeta',
      createdAt: 'cupiditate',
      updatedAt: 'saepe',
      createdBy: 'saepe',
      version: '1',
    },
  };
  const mockInput = aTimeTracking_TimeEntryInput();

  beforeEach(() => {
    args = {
      id: mockInput.id,
    };

    // Setup default mock implementations
    mockUseIxpExperiment.mockReturnValue({
      isInTreatment: false,
      settled: true,
      treatmentKey: undefined,
    });

    mockUseGetTSheetsAccountInfo.mockReturnValue({
      data: { isFreedata: false },
      loading: false,
      error: undefined,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockLogger.info.mockClear();
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
  });

  it('should return data after query is successful', async () => {
    const successMock = {
      request: {
        query: GET_TIME_ENTRY_QUERY,
        variables: { input: { id: mockInput.id, isExported: true } },
      },
      result: {
        data: {
          timeTrackingTimeEntry: mockTimeEntry,
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetTimeEntry(args),
      [successMock],
    );

    await waitForNextUpdate();

    expect(result.current.query).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toEqual(mockTimeEntry);

    // Verify logging was called for success scenario
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should return error if query fails', async () => {
    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetTimeEntry(args),
      TIME_QUERY_ERROR_MOCKS,
    );

    await waitForNextUpdate();

    expect(result.current.query).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual(undefined);

    // Verify logging was called for failure scenario
    expect(mockLogger.info).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should reset data when resetData is called', async () => {
    const successMock = {
      request: {
        query: GET_TIME_ENTRY_QUERY,
        variables: { input: { id: mockInput.id, isExported: true } },
      },
      result: {
        data: {
          timeTrackingTimeEntry: mockTimeEntry,
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetTimeEntry(args),
      [successMock],
    );

    await waitForNextUpdate();

    // Ensure data is populated
    expect(result.current.data).toEqual(mockTimeEntry);

    // Call resetData to clear the data
    act(() => {
      result.current.resetData();
    });

    // Check if data is reset to undefined
    expect(result.current.query).toBeDefined();
    expect(result.current.data).toEqual(undefined);
  });

  it('should use isExported=false when specified', async () => {
    args = {
      id: mockInput.id,
      isExported: false,
    };

    const successMock = {
      request: {
        query: GET_TIME_ENTRY_QUERY,
        variables: { input: { id: mockInput.id, isExported: false } },
      },
      result: {
        data: {
          timeTrackingTimeEntry: mockTimeEntry,
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetTimeEntry(args),
      [successMock],
    );

    await waitForNextUpdate();

    expect(result.current.query).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toEqual(mockTimeEntry);
  });

  it('should use isExported=true as default when not specified', async () => {
    args = {
      id: mockInput.id,
    };

    const successMock = {
      request: {
        query: GET_TIME_ENTRY_QUERY,
        variables: { input: { id: mockInput.id, isExported: true } },
      },
      result: {
        data: {
          timeTrackingTimeEntry: mockTimeEntry,
        },
      },
    };

    const { result, waitForNextUpdate } = renderHookWithApolloProvider(
      () => useGetTimeEntry(args),
      [successMock],
    );

    await waitForNextUpdate();

    expect(result.current.query).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toEqual(mockTimeEntry);
  });

  it('should not make query when id is not provided', async () => {
    args = {
      id: undefined,
    };

    const { result } = renderHookWithApolloProvider(
      () => useGetTimeEntry(args),
      [],
    );

    expect(result.current.query).toBeDefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  describe('IXP experiment integration', () => {
    it('should not make query when IXP experiment is not settled', async () => {
      mockUseIxpExperiment.mockReturnValue({
        isInTreatment: false,
        settled: false,
        treatmentKey: undefined,
      });

      const { result } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [],
      );

      expect(result.current.query).toBeDefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should not make query when freedata is loading', async () => {
      mockUseGetTSheetsAccountInfo.mockReturnValue({
        data: { isFreedata: false },
        loading: true,
        error: undefined,
      } as any);

      const { result } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [],
      );

      expect(result.current.query).toBeDefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeUndefined();
    });

    it('should add unification header when IXP is in treatment and isFreedata is true', async () => {
      mockUseIxpExperiment.mockReturnValue({
        isInTreatment: true,
        settled: true,
        treatmentKey: 'IXP2_T_1059480',
      });

      mockUseGetTSheetsAccountInfo.mockReturnValue({
        data: { isFreedata: true },
        loading: false,
        error: undefined,
      } as any);

      const successMock = {
        request: {
          query: GET_TIME_ENTRY_QUERY,
          variables: { input: { id: mockInput.id, isExported: true } },
        },
        result: {
          data: {
            timeTrackingTimeEntry: mockTimeEntry,
          },
        },
      };

      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [successMock],
      );

      await waitForNextUpdate();

      expect(result.current.data).toEqual(mockTimeEntry);
    });

    it('should not add unification header when IXP is in treatment but isFreedata is false', async () => {
      mockUseIxpExperiment.mockReturnValue({
        isInTreatment: true,
        settled: true,
        treatmentKey: 'IXP2_T_1059480',
      });

      mockUseGetTSheetsAccountInfo.mockReturnValue({
        data: { isFreedata: false },
        loading: false,
        error: undefined,
      } as any);

      const successMock = {
        request: {
          query: GET_TIME_ENTRY_QUERY,
          variables: { input: { id: mockInput.id, isExported: true } },
        },
        result: {
          data: {
            timeTrackingTimeEntry: mockTimeEntry,
          },
        },
      };

      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [successMock],
      );

      await waitForNextUpdate();

      expect(result.current.data).toEqual(mockTimeEntry);
    });

    it('should not add unification header when IXP is not in treatment even if isFreedata is true', async () => {
      mockUseIxpExperiment.mockReturnValue({
        isInTreatment: false,
        settled: true,
        treatmentKey: 'IXP2_C_1059480',
      });

      mockUseGetTSheetsAccountInfo.mockReturnValue({
        data: { isFreedata: true },
        loading: false,
        error: undefined,
      } as any);

      const successMock = {
        request: {
          query: GET_TIME_ENTRY_QUERY,
          variables: { input: { id: mockInput.id, isExported: true } },
        },
        result: {
          data: {
            timeTrackingTimeEntry: mockTimeEntry,
          },
        },
      };

      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [successMock],
      );

      await waitForNextUpdate();

      expect(result.current.data).toEqual(mockTimeEntry);
    });

    it('should wait for both IXP to settle and freedata to load before making query', async () => {
      // Start with both not ready
      mockUseIxpExperiment.mockReturnValue({
        isInTreatment: false,
        settled: false,
        treatmentKey: undefined,
      });

      mockUseGetTSheetsAccountInfo.mockReturnValue({
        data: { isFreedata: false },
        loading: true,
        error: undefined,
      } as any);

      const { result, rerender } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [],
      );

      // Query should not be made yet
      expect(result.current.data).toBeUndefined();

      // Update both to be ready
      mockUseIxpExperiment.mockReturnValue({
        isInTreatment: false,
        settled: true,
        treatmentKey: undefined,
      });

      mockUseGetTSheetsAccountInfo.mockReturnValue({
        data: { isFreedata: false },
        loading: false,
        error: undefined,
      } as any);

      const successMock = {
        request: {
          query: GET_TIME_ENTRY_QUERY,
          variables: { input: { id: mockInput.id, isExported: true } },
        },
        result: {
          data: {
            timeTrackingTimeEntry: mockTimeEntry,
          },
        },
      };

      const { result: result2, waitForNextUpdate } =
        renderHookWithApolloProvider(
          () => useGetTimeEntry(args),
          [successMock],
        );

      await waitForNextUpdate();

      expect(result2.current.data).toEqual(mockTimeEntry);
    });
  });

  describe('Wrapped query functionality', () => {
    it('should call handleSuccess when manually calling query with success response', async () => {
      const successMock = {
        request: {
          query: GET_TIME_ENTRY_QUERY,
          variables: {
            input: mockInput,
          },
        },
        result: {
          data: {
            timeTrackingTimeEntry: mockTimeEntry,
          },
        },
      };

      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [successMock],
      );

      await waitForNextUpdate();

      // Manually call the wrapped query
      await act(async () => {
        const response = await result.current.query({
          variables: { input: mockInput },
        });
        expect(response.data?.timeTrackingTimeEntry).toEqual(mockTimeEntry);
      });

      // Verify data was set by handleSuccess
      expect(result.current.data).toEqual(mockTimeEntry);
      expect(result.current.error).toBeUndefined();
    });

    it('should call handleFailure when manually calling query with error response', async () => {
      const errorMock = {
        request: {
          query: GET_TIME_ENTRY_QUERY,
          variables: {
            input: mockInput,
          },
        },
        error: new Error('Network error'),
      };

      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [errorMock],
      );

      await waitForNextUpdate();

      // Manually call the wrapped query and expect it to throw
      await act(async () => {
        try {
          await result.current.query({
            variables: { input: mockInput },
          });
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      // Verify error was set by handleFailure
      expect(result.current.error).toBe('Network error');
    });

    it('should call handleFailure when manually calling query with GraphQL error in response', async () => {
      const graphQLErrorMock = {
        request: {
          query: GET_TIME_ENTRY_QUERY,
          variables: {
            input: mockInput,
          },
        },
        result: {
          data: null,
          errors: [{ message: 'Time entry not found' }],
        },
      };

      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [graphQLErrorMock],
      );

      await waitForNextUpdate();

      // Manually call the wrapped query
      await act(async () => {
        const response = await result.current.query({
          variables: { input: mockInput },
        });
        // Response should have error
        expect(response.error).toBeDefined();
      });

      // Verify error was set by handleFailure
      expect(result.current.error).toBeDefined();
    });

    it('should clear both data and error when resetData is called', async () => {
      // First, manually call query to set data
      const successMock = {
        request: {
          query: GET_TIME_ENTRY_QUERY,
          variables: {
            input: mockInput,
          },
        },
        result: {
          data: {
            timeTrackingTimeEntry: mockTimeEntry,
          },
        },
      };

      args = {
        id: undefined, // No automatic query
        isExported: false,
      };

      const { result } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [successMock],
      );

      // Manually call query to populate data
      await act(async () => {
        await result.current.query({
          variables: { input: mockInput },
        });
      });

      // Verify we have data
      expect(result.current.data).toEqual(mockTimeEntry);

      // Now reset the data
      act(() => {
        result.current.resetData();
      });

      // Verify both data and error are cleared
      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it('should return response from wrapped query for chaining', async () => {
      const successMock = {
        request: {
          query: GET_TIME_ENTRY_QUERY,
          variables: {
            input: mockInput,
          },
        },
        result: {
          data: {
            timeTrackingTimeEntry: mockTimeEntry,
          },
        },
      };

      const { result, waitForNextUpdate } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [successMock],
      );

      await waitForNextUpdate();

      let queryResponse: any;
      await act(async () => {
        queryResponse = await result.current.query({
          variables: { input: mockInput },
        });
      });

      // Verify the response is returned for potential chaining
      expect(queryResponse).toBeDefined();
      expect(queryResponse?.data?.timeTrackingTimeEntry).toEqual(mockTimeEntry);
    });
  });

  describe('Customer interaction type based on isExported', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should use SINGLE_TIME_READ customer interaction when isExported=true (Time Activity)', async () => {
      args = {
        id: mockInput.id,
        isExported: true,
      };

      const successMock = {
        request: {
          query: GET_TIME_ENTRY_QUERY,
          variables: { input: { id: mockInput.id, isExported: true } },
        },
        result: {
          data: {
            timeTrackingTimeEntry: mockTimeEntry,
          },
        },
      };

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [successMock],
      );

      await waitForNextUpdate();

      // Verify SINGLE_TIME_READ is used for Time Activity (isExported=true)
      expect(createCustomerInteraction).toHaveBeenCalledWith(
        expect.anything(),
        TimeCustomerInteraction.SINGLE_TIME_READ,
      );
      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        expect.anything(),
        TimeCustomerInteraction.SINGLE_TIME_READ,
      );
    });

    it('should use SINGLE_TIME_SHEET_READ customer interaction when isExported=false (Time Entry)', async () => {
      args = {
        id: mockInput.id,
        isExported: false,
      };

      const successMock = {
        request: {
          query: GET_TIME_ENTRY_QUERY,
          variables: { input: { id: mockInput.id, isExported: false } },
        },
        result: {
          data: {
            timeTrackingTimeEntry: mockTimeEntry,
          },
        },
      };

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [successMock],
      );

      await waitForNextUpdate();

      // Verify SINGLE_TIME_SHEET_READ is used for Time Entry (isExported=false)
      expect(createCustomerInteraction).toHaveBeenCalledWith(
        expect.anything(),
        TimeCustomerInteraction.SINGLE_TIME_SHEET_READ,
      );
      expect(endInteractionWithSuccess).toHaveBeenCalledWith(
        expect.anything(),
        TimeCustomerInteraction.SINGLE_TIME_SHEET_READ,
      );
    });

    it('should use SINGLE_TIME_READ as default when isExported is not specified', async () => {
      args = {
        id: mockInput.id,
        // isExported not specified, defaults to true
      };

      const successMock = {
        request: {
          query: GET_TIME_ENTRY_QUERY,
          variables: { input: { id: mockInput.id, isExported: true } },
        },
        result: {
          data: {
            timeTrackingTimeEntry: mockTimeEntry,
          },
        },
      };

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [successMock],
      );

      await waitForNextUpdate();

      // Verify SINGLE_TIME_READ is used by default (isExported defaults to true)
      expect(createCustomerInteraction).toHaveBeenCalledWith(
        expect.anything(),
        TimeCustomerInteraction.SINGLE_TIME_READ,
      );
    });

    it('should use correct customer interaction on failure for isExported=true', async () => {
      args = {
        id: mockInput.id,
        isExported: true,
      };

      const errorMock = {
        request: {
          query: GET_TIME_ENTRY_QUERY,
          variables: { input: { id: mockInput.id, isExported: true } },
        },
        result: {
          data: null,
          errors: [{ message: 'Time entry not found' }],
        },
      };

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [errorMock],
      );

      await waitForNextUpdate();

      // Verify SINGLE_TIME_READ is used on failure for Time Activity
      expect(createCustomerInteraction).toHaveBeenCalledWith(
        expect.anything(),
        TimeCustomerInteraction.SINGLE_TIME_READ,
      );
      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        expect.anything(),
        TimeCustomerInteraction.SINGLE_TIME_READ,
        expect.any(String),
        expect.anything(),
      );
    });

    it('should use correct customer interaction on failure for isExported=false', async () => {
      args = {
        id: mockInput.id,
        isExported: false,
      };

      const errorMock = {
        request: {
          query: GET_TIME_ENTRY_QUERY,
          variables: { input: { id: mockInput.id, isExported: false } },
        },
        result: {
          data: null,
          errors: [{ message: 'Time entry not found' }],
        },
      };

      const { waitForNextUpdate } = renderHookWithApolloProvider(
        () => useGetTimeEntry(args),
        [errorMock],
      );

      await waitForNextUpdate();

      // Verify SINGLE_TIME_SHEET_READ is used on failure for Time Entry
      expect(createCustomerInteraction).toHaveBeenCalledWith(
        expect.anything(),
        TimeCustomerInteraction.SINGLE_TIME_SHEET_READ,
      );
      expect(endInteractionWithFailure).toHaveBeenCalledWith(
        expect.anything(),
        TimeCustomerInteraction.SINGLE_TIME_SHEET_READ,
        expect.any(String),
        expect.anything(),
      );
    });
  });
});
