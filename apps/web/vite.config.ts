import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  if (mode === 'sample' && !loadEnv(mode, process.cwd(), 'VITE_').VITE_GEOAPIFY_API_KEY?.trim()) {
    throw new Error('Set VITE_GEOAPIFY_API_KEY before building the public sample. Restrict this browser-visible key to the deployment origins.');
  }
  return {
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:5080', '/health': 'http://localhost:5080' } },
  };
});
