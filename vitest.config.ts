import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Test file patterns
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8', // Use V8 coverage provider
      reporter: ['text', 'json', 'html'], // Multiple report formats
      include: ['src/**/*.{ts,js}'], // Only include source files
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
        global: {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    },
    
    // Environment
    environment: 'node',
    
    // Globals (vitest globals like describe, it, expect)
    globals: true,
    
    // Setup files
    setupFiles: [],
    
    // TypeScript support
    typecheck: {
      tsconfig: './tsconfig.json'
    }
  },
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src',
      '@api-gateway': '/src/api-gateway',
      '@test': '/src/test'
    }
  }
})
