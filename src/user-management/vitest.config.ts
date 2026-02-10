import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Setup environment for tests
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file::memory:' // Use in-memory database for tests
    },

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx,js}'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/generated/**',
        '**/prisma/**'
      ],
      // Coverage thresholds
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },

    // Globals (vitest globals like describe, it, expect)
    globals: true,

    // TypeScript support
    typecheck: {
      tsconfig: './tsconfig.json'
    },

    // Test file patterns
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    // Environment
    environment: 'node'
  }
});