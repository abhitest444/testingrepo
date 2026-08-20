import {
  createBaseBreaksApiUrl,
  getAllEmployerBreakRules,
  createBreakPolicy,
  BreakType,
  DurationUnit,
} from 'src/js/service/rest/PolicyWebServiceClient';
import { buildHeaders } from 'src/js/service/ApolloClientBuilderUtils';

jest.mock('src/js/service/ApolloClientBuilderUtils', () => ({
  buildHeaders: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => '123e4567-e89b-12d3-a456-426614174000'),
}));

describe('PolicyWebServiceClient', () => {
  let sandbox: any;

  beforeEach(() => {
    sandbox = {
      appContext: {
        getRealmInfo: jest.fn(() => ({ realmId: 'test-realm-id' })),
        getUserAuthInfo: jest.fn(() => ({ authId: 'test-auth-id' })),
      },
      extensions: {
        qbo: {
          context: {
            getEnvironmentInfo: jest.fn(() => ({
              xCsrfToken: 'test-csrf-token',
            })),
            getCompanyL10nInfo: jest.fn(() => ({ region: 'US' })),
          },
        },
      },
    };
    (buildHeaders as jest.Mock).mockReturnValue({
      Authorization: 'Bearer token',
    });
    global.fetch = jest.fn();
  });

  describe('createBaseBreaksApiUrl', () => {
    it('should create the correct URL and options', () => {
      const { url, options } = createBaseBreaksApiUrl(sandbox);
      expect(url).toBe(
        'https://policiesweb-e2e.api.intuit.com/v2/company/test-realm-id/policies/breaks',
      );
      expect(options).toMatchObject({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer token',
          intuit_tid: '123e4567-e89b-12d3-a456-426614174000',
          'Content-Type': 'application/json',
        }),
        credentials: 'include',
      });
    });
  });

  describe('getAllEmployerBreakRules', () => {
    it('should fetch and return break rules data', async () => {
      const mockData: import('src/js/service/rest/PolicyWebServiceClient').GetAllEmployerBreakRulesResponse =
        {
          data: {
            content: [],
            pageable: {
              page: 0,
              size: 20,
              sort: { orders: [], empty: true, unsorted: true, sorted: false },
              offset: 0,
              pageSize: 20,
              pageNumber: 0,
              paged: true,
              unpaged: false,
            },
            total: 0,
            last: true,
            totalPages: 1,
            totalElements: 0,
            first: true,
            size: 20,
            number: 0,
            sort: { orders: [], empty: true, unsorted: true, sorted: false },
            numberOfElements: 0,
            empty: false,
          },
          errors: null,
        };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
      });
      const data = await getAllEmployerBreakRules(sandbox);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://policiesweb-e2e.api.intuit.com/v2/company/test-realm-id/policies/breaks',
        expect.any(Object),
      );
      expect(data).toEqual(mockData);
    });

    it('should throw an error if response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });
      await expect(getAllEmployerBreakRules(sandbox)).rejects.toThrow(
        'Failed to fetch break rules: 404 Not Found',
      );
    });
  });

  describe('createBreakPolicy', () => {
    const payload = {
      companyAccountId: 'test-realm-id',
      ruleName: 'Test Rule',
      active: true,
      breakType: BreakType.PAID,
      isManualBreak: true,
      isAutoBreak: false,
      noSetDuration: false,
      breakDuration: 30,
      durationUnit: DurationUnit.MINUTES,
      manualRule: {
        durationUnit: DurationUnit.MINUTES,
        autoEndBreak: true,
        allowEndBreakEarly: false,
        minRequiredBreakMinutes: 10,
        breakEndingReminder: true,
        breakEndingReminderTime: 5,
      },
    };

    it('should POST and return created break policy', async () => {
      const mockResponse = { id: 'new-break-id', ...payload };
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve(mockResponse),
      });
      const data = await createBreakPolicy(sandbox, payload as any);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://policiesweb-e2e.api.intuit.com/v2/company/test-realm-id/policies/breaks',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      );
      expect(data).toEqual(mockResponse);
    });

    it('should throw an error if response is not ok', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      });
      await expect(createBreakPolicy(sandbox, payload as any)).rejects.toThrow(
        'Failed to create break policy: Bad Request',
      );
    });
  });
});
