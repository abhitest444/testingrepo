import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
import { FlakinessReporter } from './src/utils/flakiness-reporter';

dotenv.config();

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    sequence: { concurrent: false },
    fileParallelism: false,
    reporters: ['default', new FlakinessReporter()],
  },
});
