import { defineConfig, UserConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
//
// Build-time environment variables (injected via Docker build args, see PROJECT.md):
//   VITE_API_URL  — base URL for the API gateway  (default: http://localhost:3000)
//   VITE_GAME_URL — base URL for the Colyseus game server (default: http://localhost:2567)
//
// These are baked into the bundle at build time by Vite (import.meta.env.VITE_*).
// To build for remote play: VITE_API_URL=https://<ip> VITE_GAME_URL=https://<ip>/colyseus docker compose up --build
// Or simply: make remote   (auto-detects LAN IP and handles cert + build)
export default defineConfig({
  plugins: [
    tailwindcss() as UserConfig['plugins'],
    react() as UserConfig['plugins']
  ],
  optimizeDeps: { exclude: ['@babylonjs/havok'] }
});
