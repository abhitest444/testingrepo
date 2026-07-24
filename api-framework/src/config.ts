export type ApiConfig = {
  baseUrl: string;
  username: string;
  password: string;
  timeoutMs: number;
};

export function loadConfig(): ApiConfig {
  return {
    baseUrl: (process.env.API_BASE_URL ?? 'https://restful-booker.herokuapp.com').replace(/\/$/, ''),
    username: process.env.BOOKER_USERNAME ?? 'admin',
    password: process.env.BOOKER_PASSWORD ?? 'password123',
    timeoutMs: Number(process.env.API_TIMEOUT_MS ?? 20_000),
  };
}
