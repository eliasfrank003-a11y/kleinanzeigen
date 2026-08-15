import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Served from a project page, so every asset URL needs the repo name in front.
export default defineConfig({
  base: '/kleinanzeigen/',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
