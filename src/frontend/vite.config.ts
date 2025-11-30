import { defineConfig } from 'vite';

export default defineConfig({
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});
