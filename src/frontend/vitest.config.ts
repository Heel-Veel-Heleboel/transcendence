import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
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
        './vitest.config.ts',
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
            setupFiles: ['./setup/canvas.js'],

            // Environment
            environment: 'jsdom'
          }
        }
      ]
    },

    // Resolve configuration
    resolve: {
      alias: {
        '@': '/src',
        '@test': '/src/test'
      }
    }
  })
);
