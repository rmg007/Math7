/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true, // Required for ArchUnit custom matchers
    environment: 'jsdom',
    setupFiles: ['./src/vitest.setup.ts'],
    exclude: ['tests/**', '__checks__/**', 'node_modules/**'], // Exclude Playwright and Checkly tests
    coverage: {
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      all: true,
    },
  },
});
