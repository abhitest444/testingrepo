import {
  CUSTOMER_ID_QUERY_PARAM,
  getQueryParams,
  getTimeTrackingQueryParams,
  ID_QUERY_PARAM,
  removeTimeTrackingQueryParams,
  TRANSACTION_ID_QUERY_PARAM,
} from 'src/js/service/utils/queryStringUtil';

describe('Query Parameter Utilities', () => {
  beforeEach(() => {
    // Reset the window location search before each test
    delete (window as any).location;
    (window as any).location = { search: '', pathname: '/test' };
    window.history.replaceState = jest.fn();
  });

  describe('getQueryParams', () => {
    it('should return an empty Map when there are no query parameters', () => {
      const queryParams = getQueryParams();
      expect(queryParams.size).toBe(0);
    });

    it('should return a Map with query parameters', () => {
      (window as any).location.search = '?param1=value1&param2=value2';
      const queryParams = getQueryParams();
      expect(queryParams.size).toBe(2);
      expect(queryParams.get('param1')).toBe('value1');
      expect(queryParams.get('param2')).toBe('value2');
    });

    it('should decode query parameter values', () => {
      (window as any).location.search = '?param1=value%201';
      const queryParams = getQueryParams();
      expect(queryParams.get('param1')).toBe('value 1');
    });
  });

  describe('getIdFromQueryParams', () => {
    it('should return null when "id" parameter is not present', () => {
      const { id } = getTimeTrackingQueryParams();
      expect(id).toBeUndefined();
    });

    it('should return the value of "id" parameter when present', () => {
      (window as any).location.search = '?id=12345';
      const { id } = getTimeTrackingQueryParams();
      expect(id).toBe('12345');
    });

    it('should return null when "id" parameter is present but empty', () => {
      (window as any).location.search = '?id=';
      const { id } = getTimeTrackingQueryParams();
      expect(id).toBeUndefined();
    });
  });

  describe('getTransactionIdFromQueryParams', () => {
    it('should return null when "id" parameter is not present', () => {
      const { txnId } = getTimeTrackingQueryParams();
      expect(txnId).toBeUndefined();
    });

    it('should return the value of "id" parameter when present', () => {
      (window as any).location.search = '?txnId=12345';
      const { txnId } = getTimeTrackingQueryParams();
      expect(txnId).toBe('12345');
    });

    it('should return null when "id" parameter is present but empty', () => {
      (window as any).location.search = '?txnId=';
      const { txnId } = getTimeTrackingQueryParams();
      expect(txnId).toBeUndefined();
    });
  });

  describe('getTCustomerIdFromQueryParams', () => {
    it('should return null when "id" parameter is not present', () => {
      const { customerId } = getTimeTrackingQueryParams();
      expect(customerId).toBeUndefined();
    });

    it('should return the value of "id" parameter when present', () => {
      (window as any).location.search = '?customerId=12345';
      const { customerId } = getTimeTrackingQueryParams();
      expect(customerId).toBe('12345');
    });

    it('should return null when "id" parameter is present but empty', () => {
      (window as any).location.search = '?customerId=';
      const { customerId } = getTimeTrackingQueryParams();
      expect(customerId).toBeUndefined();
    });
  });

  describe('removeIdFromQueryParams', () => {
    it('should remove the "id" parameter from the query string', () => {
      (window as any).location.search = '?id=12345&param1=value1';
      removeTimeTrackingQueryParams();
      const queryParams = getQueryParams();
      expect(queryParams.has(ID_QUERY_PARAM)).toBe(true);
      expect(queryParams.get('param1')).toBe('value1');
      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        '',
        '/test?param1=value1',
      );
    });

    it('should remove the "txnid" parameter from the query string', () => {
      (window as any).location.search = '?txnId=12345&param1=value1';
      removeTimeTrackingQueryParams();
      const queryParams = getQueryParams();
      expect(queryParams.has(TRANSACTION_ID_QUERY_PARAM)).toBe(true);
      expect(queryParams.get('param1')).toBe('value1');
      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        '',
        '/test?param1=value1',
      );
    });

    it('should remove the "customerId" parameter from the query string', () => {
      (window as any).location.search = '?customerId=12345&param1=value1';
      removeTimeTrackingQueryParams();
      const queryParams = getQueryParams();
      expect(queryParams.has(CUSTOMER_ID_QUERY_PARAM)).toBe(true);
      expect(queryParams.get('param1')).toBe('value1');
      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        '',
        '/test?param1=value1',
      );
    });

    it('should remove both "id" and "txnid" parameter from the query string', () => {
      (window as any).location.search = '?id=123&txnId=12345&param1=value1';
      removeTimeTrackingQueryParams();
      const queryParams = getQueryParams();
      expect(queryParams.has(ID_QUERY_PARAM)).toBe(true);
      expect(queryParams.get('param1')).toBe('value1');
      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        '',
        '/test?param1=value1',
      );
    });

    it('should handle empty query params string after removal of existing params', () => {
      (window as any).location.search = '?id=123&txnId=12345';
      removeTimeTrackingQueryParams();
      const queryParams = getQueryParams();
      expect(queryParams.has(ID_QUERY_PARAM)).toBe(true);
      expect(queryParams.has(TRANSACTION_ID_QUERY_PARAM)).toBe(true);
      expect(window.history.replaceState).toHaveBeenCalledWith(
        null,
        '',
        '/test',
      );
    });

    it('should not change the URL if "id" parameter is not present', () => {
      (window as any).location.search = '?param1=value1';
      removeTimeTrackingQueryParams();
      const queryParams = getQueryParams();
      expect(queryParams.has(ID_QUERY_PARAM)).toBe(false);
      expect(queryParams.get('param1')).toBe('value1');
      expect(window.history.replaceState).not.toHaveBeenCalled();
    });

    it('should handle an empty query string', () => {
      (window as any).location.search = '';
      removeTimeTrackingQueryParams();
      const queryParams = getQueryParams();
      expect(queryParams.has(ID_QUERY_PARAM)).toBe(false);
      expect(window.history.replaceState).not.toHaveBeenCalled();
    });
  });
});
