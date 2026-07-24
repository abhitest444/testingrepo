import type { HttpClient } from '../http/client';
import {
  AuthFailureSchema,
  AuthTokenSchema,
  parseOrThrow,
} from '../schemas/booking';

export class AuthClient {
  constructor(
    private readonly http: HttpClient,
    private readonly username: string,
    private readonly password: string,
  ) {}

  async createToken(
    credentials: { username: string; password: string } = {
      username: this.username,
      password: this.password,
    },
  ): Promise<string> {
    const response = await this.http.request<unknown>({
      method: 'POST',
      path: '/auth',
      body: credentials,
      throwOnError: false,
    });

    // Valid login: { token }
    const tokenParsed = AuthTokenSchema.safeParse(response.json);
    if (response.status === 200 && tokenParsed.success) {
      return tokenParsed.data.token;
    }

    // Invalid login quirk: still HTTP 200 with { reason: "Bad credentials" }
    const failure = AuthFailureSchema.safeParse(response.json);
    if (failure.success) {
      throw new Error(`Auth rejected: ${failure.data.reason}`);
    }

    throw new Error(`Unexpected auth response ${response.status}: ${response.text.slice(0, 200)}`);
  }

  async attemptLogin(credentials: { username: string; password: string }) {
    const response = await this.http.request<unknown>({
      method: 'POST',
      path: '/auth',
      body: credentials,
      throwOnError: false,
    });

    return {
      status: response.status,
      body: response.json,
      token: AuthTokenSchema.safeParse(response.json).success
        ? AuthTokenSchema.parse(response.json).token
        : undefined,
      failureReason: AuthFailureSchema.safeParse(response.json).success
        ? parseOrThrow(AuthFailureSchema, response.json, 'auth failure').reason
        : undefined,
    };
  }
}
