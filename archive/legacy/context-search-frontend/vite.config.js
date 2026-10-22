import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ["localhost", ".trycloudflare.com"],
    proxy: {
      "/api": "http://localhost:8000",
    },
    hmr: {
      clientPort: 443,
    },
  },
});
