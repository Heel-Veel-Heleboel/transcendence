import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'generated/**'
      ],
      thresholds: {
        branches: 70,
        functions: 70,
        lines: 70,
        statements: 70
      }
    },

    // Globals
    globals: true,

    // Test file patterns
    include: ['test/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],

    // Environment
    environment: 'node',

    // TypeScript support
    typecheck: {
      tsconfig: './tsconfig.json'
    }
  }
});
