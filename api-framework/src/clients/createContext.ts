import { loadConfig } from '../config';
import { AuthClient } from '../clients/AuthClient';
import { BookingClient } from '../clients/BookingClient';
import { HttpClient } from '../http/client';

export type ApiContext = {
  http: HttpClient;
  auth: AuthClient;
  bookings: BookingClient;
  config: ReturnType<typeof loadConfig>;
};

export function createApiContext(): ApiContext {
  const config = loadConfig();
  const http = new HttpClient(config.baseUrl, config.timeoutMs);
  return {
    config,
    http,
    auth: new AuthClient(http, config.username, config.password),
    bookings: new BookingClient(http),
  };
}
