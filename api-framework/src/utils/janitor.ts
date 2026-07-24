import type { BookingClient } from '../clients/BookingClient';

/**
 * Track created booking IDs and delete them after the test.
 * Critical on shared public APIs so failures don't leave permanent junk.
 */
export class BookingJanitor {
  private readonly ids = new Set<number>();

  constructor(
    private readonly bookings: BookingClient,
    private readonly getToken: () => Promise<string>,
  ) {}

  track(id: number): number {
    this.ids.add(id);
    return id;
  }

  async cleanup(): Promise<void> {
    if (this.ids.size === 0) return;
    const token = await this.getToken();
    const pending = [...this.ids];
    this.ids.clear();

    for (const id of pending) {
      try {
        await this.bookings.remove(id, token);
      } catch {
        // Best-effort: demo API may already have dropped the record.
      }
    }
  }
}
