import { cleanup } from '@testing-library/react';

// Global test setup

// Cleanup after each test to prevent memory leaks
afterEach(() => {
  cleanup();
  jest.clearAllTimers();
});

// Restore real timers after all tests
afterAll(() => {
  jest.useRealTimers();
});

// Mock crypto.randomUUID for tests
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-123',
  },
});

// Mock IntersectionObserver for tests
global.IntersectionObserver = class IntersectionObserver {
  // eslint-disable-next-line class-methods-use-this
  disconnect() {}

  // eslint-disable-next-line class-methods-use-this
  observe() {}

  // eslint-disable-next-line class-methods-use-this
  takeRecords() {
    return [];
  }

  // eslint-disable-next-line class-methods-use-this
  unobserve() {}
} as any;

// Mock useGetCustomFields globally for all tests
jest.mock('src/js/service/hooks/timeEntries/useGetCustomFields', () => ({
  useGetCustomFields: jest.fn(() => ({
    customFields: [],
    loading: false,
    error: undefined,
    query: jest.fn(),
  })),
  mapCustomFields: jest.fn(
    (data) =>
      data?.timeTrackingCustomFields?.edges?.map((edge: any) => edge.node) ||
      [],
  ),
}));

// Make this a module
export {};
