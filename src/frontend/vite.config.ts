import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss() as UserConfig['plugins'],
    react() as UserConfig['plugins']
  ],
  optimizeDeps: { exclude: ['@babylonjs/havok'] }
});
