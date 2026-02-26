import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: 'file::memory:',
      JWT_PRIVATE_KEY_PATH: './keys/jwt_private.pem',
      JWT_PUBLIC_KEY_PATH: './keys/jwt_public.pem'
    },
    // Coverage configuration
    coverage: {
      provider: 'v8', // Use V8 coverage provider
      reporter: ['text', 'json', 'html'], // Multiple report formats
      include: ['src/**/*.{ts,tsx,js}'], // Only include source files
      exclude: [
        'node_modules/',
        'dist/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
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

    projects: [
      {
        extends: true,
        test: {
          // Test file patterns
          include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

          // Environment
          environment: 'node'
        }
      },
      {
        extends: true,
        test: {
          // Test file patterns
          include: ['test/**/*.{jsdom,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

          // Setup files
          setupFiles: ['./test/setup/canvas.js'],

        }
      }
    ]
  },

  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@api-gateway': '/src/api-gateway',
      '@test': '/src/test'
    }
  }
});
