import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    dir: './src/__tests__',
    include: ['**/*.test.ts'],
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'dashboard/',
        'archive/',
        '**/*.d.ts',
        '**/__tests__/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': './src'
    }
  }
});
