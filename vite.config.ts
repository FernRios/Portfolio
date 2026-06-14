import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// During development the frontend runs on :5173 and the API on :3000.
// This proxy forwards /api/* to the backend so the browser sees one origin
// (no CORS headaches). In production, set VITE_API_BASE instead (see .env.example).
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
