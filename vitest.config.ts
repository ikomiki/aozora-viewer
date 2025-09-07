/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 5000,
    hookTimeout: 5000,
    teardownTimeout: 5000,
    globals: true,
    environment: 'jsdom',
  },
});
