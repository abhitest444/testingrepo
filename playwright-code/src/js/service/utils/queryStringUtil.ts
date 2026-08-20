export const ID_QUERY_PARAM = 'id';
export const TRANSACTION_ID_QUERY_PARAM = 'txnId';
export const CUSTOMER_ID_QUERY_PARAM = 'customerId';
export const TAB_QUERY_PARAM = 'tab';
export const VIEW_QUERY_PARAM = 'view';

interface TimeTrackingQueryParams {
  id?: string;
  txnId?: string;
  customerId?: string;
}

export const getQueryParams = (): Map<string, string> => {
  const queryParams = new Map<string, string>();
  const searchParams = new URLSearchParams(window.location.search);

  searchParams.forEach((value, key) => {
    queryParams.set(key, value);
  });

  return queryParams;
};

export const removeTimeTrackingQueryParams = (): void => {
  const searchParams = getQueryParams();

  let paramsDeleted = false;

  if (searchParams.has(ID_QUERY_PARAM)) {
    searchParams.delete(ID_QUERY_PARAM);
    paramsDeleted = true;
  }

  if (searchParams.has(TRANSACTION_ID_QUERY_PARAM)) {
    searchParams.delete(TRANSACTION_ID_QUERY_PARAM);
    paramsDeleted = true;
  }

  if (searchParams.has(CUSTOMER_ID_QUERY_PARAM)) {
    searchParams.delete(CUSTOMER_ID_QUERY_PARAM);
    paramsDeleted = true;
  }

  if (paramsDeleted) {
    // Check if there are any remaining query parameters
    const queryString = Array.from(searchParams.entries())
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      )
      .join('&');

    // If queryString is empty, remove the query part from the URL
    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;

    window.history.replaceState(window.history.state, '', newUrl);
  }
};

export const getTimeTrackingQueryParams = (): TimeTrackingQueryParams => {
  const id = getQueryParams().get(ID_QUERY_PARAM) || undefined;
  const txnId = getQueryParams().get(TRANSACTION_ID_QUERY_PARAM) || undefined;
  const customerId = getQueryParams().get(CUSTOMER_ID_QUERY_PARAM) || undefined;
  return { id, txnId, customerId };
};
