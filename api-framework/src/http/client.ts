export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly bodyText: string,
    readonly path: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  method?: HttpMethod;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  token?: string;
  /** When false, non-2xx responses are returned instead of throwing. Default true. */
  throwOnError?: boolean;
};

export type ApiResponse<T = unknown> = {
  status: number;
  ok: boolean;
  headers: Headers;
  json: T;
  text: string;
};

/**
 * Thin typed HTTP client over fetch — no Playwright dependency.
 * Keeps base URL, JSON headers, auth cookie, and error shaping in one place.
 */
export class HttpClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs = 20_000,
  ) {}

  async request<T = unknown>(options: RequestOptions): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${options.path.startsWith('/') ? '' : '/'}${options.path}`;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    };

    if (options.token) {
      headers.Cookie = `token=${options.token}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: options.method ?? (options.body !== undefined ? 'POST' : 'GET'),
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    let json: unknown = undefined;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = undefined;
      }
    }

    const result: ApiResponse<T> = {
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      json: json as T,
      text,
    };

    const throwOnError = options.throwOnError !== false;
    // Restful Booker DELETE returns 201 Created — treat as success.
    const softOk = response.ok || response.status === 201;
    if (throwOnError && !softOk) {
      throw new ApiError(
        `${options.method ?? 'GET'} ${options.path} failed with ${response.status}`,
        response.status,
        text.slice(0, 500),
        options.path,
      );
    }

    return result;
  }
}
