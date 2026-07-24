import type { APIRequestContext, APIResponse } from '@playwright/test';

export type ApiRequestOptions<TData = unknown> = {
  data?: TData;
  headers?: Record<string, string>;
};

export class BaseApiClient {
  constructor(
    protected readonly request: APIRequestContext,
    protected readonly defaultHeaders: Record<string, string> = {},
  ) {}

  protected async requestJson<TResponse>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    options: ApiRequestOptions = {},
    expectedStatus?: number,
  ): Promise<TResponse> {
    const response = await this.request[method](url, {
      ...options,
      headers: { ...this.defaultHeaders, ...(options.headers ?? {}) },
    });

    if (expectedStatus !== undefined) {
      if (response.status() !== expectedStatus) {
        throw new Error(
          `${method.toUpperCase()} ${url} failed: expected ${expectedStatus}, got ${response.status()} ${await response.text()}`,
        );
      }
    } else if (!response.ok()) {
      throw new Error(`${method.toUpperCase()} ${url} failed: ${response.status()} ${await response.text()}`);
    }

    return (await response.json()) as TResponse;
  }

  protected async requestText(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    options: ApiRequestOptions = {},
    expectedStatus?: number,
  ): Promise<string> {
    const response = await this.request[method](url, {
      ...options,
      headers: { ...this.defaultHeaders, ...(options.headers ?? {}) },
    });

    if (expectedStatus !== undefined) {
      if (response.status() !== expectedStatus) {
        throw new Error(
          `${method.toUpperCase()} ${url} failed: expected ${expectedStatus}, got ${response.status()} ${await response.text()}`,
        );
      }
    } else if (!response.ok()) {
      throw new Error(`${method.toUpperCase()} ${url} failed: ${response.status()} ${await response.text()}`);
    }

    return await response.text();
  }

  protected buildAuthHeaders(token: string): Record<string, string> {
    return {
      Cookie: `token=${token}`,
    };
  }

  protected async ensureStatus(response: APIResponse, url: string, expectedStatus: number): Promise<void> {
    if (response.status() !== expectedStatus) {
      throw new Error(`${url} failed: expected ${expectedStatus}, got ${response.status()} ${await response.text()}`);
    }
  }
}
