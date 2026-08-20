export const mockRefreshIfOlderThan = jest.fn();
export const mockGet = jest.fn();
export const mockPost = jest.fn();
export const mockPut = jest.fn();
export const mockPatch = jest.fn().mockResolvedValue({
  ok: true,
  json: () => ({
    DebitCard: [
      {
        id: '123',
        walletId: '1234567890',
      },
    ],
  }),
});

// GPS Server Util
export const mockRealmsResponse = jest.fn().mockResolvedValue({
  ok: true,
  json: jest
    .fn()
    .mockResolvedValue({ realms: [{ realmId: '123148990169989' }] }),
});

/*
 * The GPSv3 endpoint doesn't seem to have any error cases except being unauthenticated,
 * which returns a 401 error and some XML
 */
export const mockFailedRealmsResponse = jest.fn().mockRejectedValue({
  status: 401,
});

export const mockUnexpectedRealmsResponse = jest.fn().mockResolvedValue({
  ok: false,
  status: 401,
  url: 'https://silver-release.qbo.intuit.com/app/shopkeep',
  headers: {
    get: () => 'Test',
  },
  text: jest.fn().mockResolvedValue('An unknown error has occurred'),
  errorMessage: 'An unknown error has occurred',
});

export const mockFailedMFAPatch = jest.fn().mockRejectedValue({
  code: 'ACCOUNT_2028',
  type: 'INVALID_REQUEST',
  message: 'MFA Verification failed',
  detail: 'MFA Verification failed',
});

export const mockFailedUpdateReasonPatch = jest.fn().mockRejectedValue({
  code: 'ACCOUNT_0007',
  detail: 'Invalid request',
  message: 'Invalid Request: updatereason cannot be null',
  status: 400,
  type: 'INVALID_REQUEST',
  url: 'https://paymentaccount-sbg-e2e.api.intuit.com/v2/accounts/9130346596760586',
});

export const mockFailedDeclinedCardPatch = jest.fn().mockRejectedValue({
  code: 'ACCOUNT_3029',
  type: 'INVALID_REQUEST',
  message: 'Debit Card Declined',
  detail: 'Debit Card Declined',
});

export const RestClient = jest.fn().mockImplementation(({ baseUrl }) => ({
  baseUrl,
  refreshIfOlderThan: mockRefreshIfOlderThan,
  get: mockGet,
  post: mockPost,
  put: mockPut,
  patch: mockPatch,
}));

RestClient.AuthConstants = {
  BROWSER_AUTH: 'BROWSER_AUTH',
};

export default RestClient;
