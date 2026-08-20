/**
 * Fetch with automatic retry logic for failed requests
 * Retries on network errors and 5xx server errors, but not on 4xx client errors
 */

interface FetchWithRetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  shouldRetry?: (error: Error | null, response: Response | null) => boolean;
}

const defaultShouldRetry = (
  error: Error | null,
  response: Response | null,
): boolean => {
  // Retry on network errors
  if (error) {
    return true;
  }

  // Don't retry on successful responses
  if (response?.ok) {
    return false;
  }

  // Retry on specific 4xx errors that are transient
  if (response) {
    const { status } = response;

    // 429 Too Many Requests - rate limiting
    if (status === 429) {
      return true;
    }

    // 424 Failed Dependency - temporary dependency failure
    if (status === 424) {
      return true;
    }

    // Don't retry on other 4xx client errors (auth failures, bad requests, etc.)
    // These require fixing the request, not retrying
    if (status >= 400 && status < 500) {
      return false;
    }

    // Retry on 5xx server errors
    if (status >= 500) {
      return true;
    }
  }

  return false;
};

/**
 * Wrapper around fetch that automatically retries failed requests
 * @param url - URL to fetch
 * @param options - Fetch options (headers, body, method, etc.)
 * @param retryOptions - Retry configuration
 * @returns Promise that resolves to the Response
 */
export const fetchWithRetry = async (
  url: string,
  options: RequestInit,
  retryOptions: FetchWithRetryOptions = {},
): Promise<Response> => {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    shouldRetry = defaultShouldRetry,
  } = retryOptions;

  let lastError: Error | null = null;
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await fetch(url, options);
      lastResponse = response;
      lastError = null;

      // If response is ok, return immediately
      if (response.ok) {
        return response;
      }

      // Check if we should retry based on response
      const shouldRetryRequest = shouldRetry(null, response);

      if (!shouldRetryRequest || attempt === maxRetries) {
        // Don't retry, return the failed response
        return response;
      }
    } catch (error) {
      lastError = error as Error;
      lastResponse = null;

      // Check if we should retry based on error
      const shouldRetryRequest = shouldRetry(lastError, null);

      if (!shouldRetryRequest || attempt === maxRetries) {
        // Don't retry, throw the error
        throw error;
      }
    }

    // Wait before retrying (exponential backoff)
    if (attempt < maxRetries) {
      const delayMs = initialDelayMs * Math.pow(2, attempt);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // If we get here, all retries failed
  if (lastError) {
    throw lastError;
  }

  // Return the last failed response
  return lastResponse as Response;
};
