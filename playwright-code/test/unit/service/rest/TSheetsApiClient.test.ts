import { Environment } from '@appfabric/sandbox-spec';
import { Sandbox } from 'src/js/common/sandbox';
import {
  getTSheetsAccountInfo,
  getTSheetsCurrentUser,
  getTSheetsRestApiUrl,
  TSheetsAccountInfo,
} from 'src/js/service/rest/TSheetsApiClient';
import { ERROR_IDS } from 'src/js/common/constants';
import { getDefaultSandbox } from 'test/unit/testUtils';

// Mock the buildHeaders function
jest.mock('src/js/service/ApolloClientBuilderUtils', () => ({
  ...jest.requireActual('src/js/service/ApolloClientBuilderUtils'),
  buildHeaders: jest.fn(() => ({
    Authorization: 'test-auth-header',
    'Content-Type': 'application/json',
  })),
  getEnvFromSandbox: jest.fn(),
}));

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

describe('TSheetsApiClient', () => {
  let mockSandbox: Sandbox;
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockSandbox = getDefaultSandbox();
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getTSheetsRestApiUrl', () => {
    it('should return production URL for prod environment', () => {
      const {
        getEnvFromSandbox,
      } = require('src/js/service/ApolloClientBuilderUtils');
      getEnvFromSandbox.mockReturnValue(Environment.PROD);

      const url = getTSheetsRestApiUrl(mockSandbox);
      expect(url).toBe('https://tsheets.api.intuit.com');
    });

    it('should return E2E URL for e2e environment', () => {
      const {
        getEnvFromSandbox,
      } = require('src/js/service/ApolloClientBuilderUtils');
      getEnvFromSandbox.mockReturnValue(Environment.E2E);

      const url = getTSheetsRestApiUrl(mockSandbox);
      expect(url).toBe('https://tsheets-e2e.api.intuit.com');
    });

    it('should return QA URL for qa environment', () => {
      const {
        getEnvFromSandbox,
      } = require('src/js/service/ApolloClientBuilderUtils');
      getEnvFromSandbox.mockReturnValue(Environment.QA);

      const url = getTSheetsRestApiUrl(mockSandbox);
      expect(url).toBe('https://tsheets-qal.api.intuit.com');
    });

    it('should return PERF URL for perf environment', () => {
      const {
        getEnvFromSandbox,
      } = require('src/js/service/ApolloClientBuilderUtils');
      getEnvFromSandbox.mockReturnValue(Environment.PERF);

      const url = getTSheetsRestApiUrl(mockSandbox);
      expect(url).toBe('https://tsheets-prf.api.intuit.com');
    });

    it('should return default E2E URL for unknown environment', () => {
      const {
        getEnvFromSandbox,
      } = require('src/js/service/ApolloClientBuilderUtils');
      getEnvFromSandbox.mockReturnValue('UNKNOWN' as Environment);

      const url = getTSheetsRestApiUrl(mockSandbox);
      expect(url).toBe('https://tsheets-e2e.api.intuit.com');
    });
  });

  describe('getTSheetsAccountInfo', () => {
    const mockSuccessResponse = {
      results: {
        my_realm: {
          account_type: 'freedata',
          is_oii: true,
          account_creation_date: '2024-01-01',
        },
      },
    };

    beforeEach(() => {
      const {
        getEnvFromSandbox,
      } = require('src/js/service/ApolloClientBuilderUtils');
      getEnvFromSandbox.mockReturnValue(Environment.E2E);
    });

    it('should successfully fetch account info for freedata account', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => mockSuccessResponse,
      });

      const result = await getTSheetsAccountInfo(mockSandbox);

      expect(result).toEqual({
        hasTSheetsAccount: true,
        isFreedata: true,
        isOII: true,
        accountType: 'freedata',
        accountCreationDate: '2024-01-01',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://tsheets-e2e.api.intuit.com/api/v1/my_realm?account_types=all',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
          headers: expect.objectContaining({
            Authorization: 'test-auth-header',
            'Content-Type': 'application/json',
          }),
        }),
      );
    });

    it('should successfully fetch account info for regular account', async () => {
      const regularAccountResponse = {
        results: {
          my_realm: {
            account_type: 'regular',
            is_oii: false,
            account_creation_date: '2023-01-01',
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => regularAccountResponse,
      });

      const result = await getTSheetsAccountInfo(mockSandbox);

      expect(result).toEqual({
        hasTSheetsAccount: true,
        isFreedata: false,
        isOII: false,
        accountType: 'regular',
        accountCreationDate: '2023-01-01',
      });
    });

    it('should return no account when my_realm is null', async () => {
      const noAccountResponse = {
        results: {
          my_realm: null,
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => noAccountResponse,
      });

      const result = await getTSheetsAccountInfo(mockSandbox);

      expect(result).toEqual({
        hasTSheetsAccount: false,
        isFreedata: false,
        isOII: false,
        accountType: '',
        accountCreationDate: null,
      });
    });

    it('should handle null account_creation_date', async () => {
      const responseWithNullDate = {
        results: {
          my_realm: {
            account_type: 'freedata',
            is_oii: true,
            account_creation_date: null,
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => responseWithNullDate,
      });

      const result = await getTSheetsAccountInfo(mockSandbox);

      expect(result.accountCreationDate).toBeNull();
    });

    it('should throw error when API returns non-200 status', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(getTSheetsAccountInfo(mockSandbox)).rejects.toThrow(
        'Error in my_realm response: Internal Server Error',
      );

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component=TSheetsApiClient Event=API error',
        expect.objectContaining({
          status: 500,
          error: 'Internal Server Error',
        }),
      );
    });

    it('should throw error when response contains error object', async () => {
      const errorResponse = {
        results: {
          my_realm: null,
        },
        error: {
          message: 'Account not found',
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => errorResponse,
      });

      await expect(getTSheetsAccountInfo(mockSandbox)).rejects.toThrow(
        'Error in my_realm: Account not found',
      );

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component=TSheetsApiClient Event=Response error',
        expect.objectContaining({
          error: 'Account not found',
        }),
      );
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getTSheetsAccountInfo(mockSandbox)).rejects.toThrow(
        'Network error',
      );

      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component=TSheetsApiClient Event=Failed to fetch account info',
        expect.objectContaining({
          exception: 'Network error',
        }),
      );
    });

    it('should log info when request is initiated', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => mockSuccessResponse,
      });

      await getTSheetsAccountInfo(mockSandbox);

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component=TSheetsApiClient Event=Fetching account info',
        expect.objectContaining({
          url: 'https://tsheets-e2e.api.intuit.com/api/v1/my_realm?account_types=all',
          intuit_tid: 'test-uuid-123',
        }),
      );
    });

    it('should log info when account info is fetched successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => mockSuccessResponse,
      });

      await getTSheetsAccountInfo(mockSandbox);

      expect(mockSandbox.logger.info).toHaveBeenCalledWith(
        'Component=TSheetsApiClient Event=Account info fetched',
        expect.objectContaining({
          hasTSheetsAccount: true,
          isFreedata: true,
          isOII: true,
          accountType: 'freedata',
          intuit_tid: 'test-uuid-123',
        }),
      );
    });

    it('should include intuit_tid header in request', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => mockSuccessResponse,
      });

      await getTSheetsAccountInfo(mockSandbox);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            intuit_tid: 'test-uuid-123',
          }),
        }),
      );
    });

    it('should handle OII account with all flags set', async () => {
      const oiiAccountResponse = {
        results: {
          my_realm: {
            account_type: 'oii',
            is_oii: true,
            account_creation_date: '2024-06-01',
          },
        },
      };

      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => oiiAccountResponse,
      });

      const result = await getTSheetsAccountInfo(mockSandbox);

      expect(result).toEqual({
        hasTSheetsAccount: true,
        isFreedata: false,
        isOII: true,
        accountType: 'oii',
        accountCreationDate: '2024-06-01',
      });
    });
  });

  describe('getTSheetsCurrentUser', () => {
    beforeEach(() => {
      const {
        getEnvFromSandbox,
      } = require('src/js/service/ApolloClientBuilderUtils');
      getEnvFromSandbox.mockReturnValue(Environment.E2E);
    });

    it('maps snake_case fields to camelCase and returns the current user', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          results: {
            users: {
              '1': {
                id: 1,
                submitted_to: '2026-06-15',
                approved_to: '2026-06-10',
              },
            },
          },
        }),
      });

      const result = await getTSheetsCurrentUser(mockSandbox);

      expect(result).toEqual({
        id: 1,
        submittedTo: '2026-06-15',
        approvedTo: '2026-06-10',
      });
      expect(mockFetch).toHaveBeenCalledWith(
        'https://tsheets-e2e.api.intuit.com/api/v1/current_user',
        expect.objectContaining({ method: 'GET', credentials: 'include' }),
      );
    });

    it('defaults missing submitted_to/approved_to to null', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({
          results: { users: { '1': { id: 1 } } },
        }),
      });

      const result = await getTSheetsCurrentUser(mockSandbox);

      expect(result).toEqual({ id: 1, submittedTo: null, approvedTo: null });
    });

    it('throws and logs when the API returns a non-200 status', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 500,
        text: async () => 'Internal Server Error',
      });

      await expect(getTSheetsCurrentUser(mockSandbox)).rejects.toThrow(
        'Error in current_user response: Internal Server Error',
      );
      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component=TSheetsApiClient Event=current_user API error',
        expect.objectContaining({
          status: 500,
          error: 'Internal Server Error',
        }),
      );
      expect(mockSandbox.logger.logException).toHaveBeenCalled();
    });

    it('throws when the response contains an error object', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({ error: { message: 'Unauthorized' } }),
      });

      await expect(getTSheetsCurrentUser(mockSandbox)).rejects.toThrow(
        'Error in current_user: Unauthorized',
      );
    });

    it('throws when the users map is empty (no current user resolved)', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: async () => ({ results: { users: {} } }),
      });

      await expect(getTSheetsCurrentUser(mockSandbox)).rejects.toThrow(
        'no user record returned',
      );
      expect(mockSandbox.logger.error).toHaveBeenCalledWith(
        'Component=TSheetsApiClient Event=current_user no user record',
        expect.objectContaining({ intuit_tid: 'test-uuid-123' }),
      );
    });

    it('logs an exception and rethrows when fetch rejects', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(getTSheetsCurrentUser(mockSandbox)).rejects.toThrow(
        'Network error',
      );
      expect(mockSandbox.logger.logException).toHaveBeenCalledWith(
        ERROR_IDS.TSHEETS_CURRENT_USER_FAILED,
        expect.any(Error),
        expect.objectContaining({ intuit_tid: 'test-uuid-123' }),
      );
    });
  });
});
