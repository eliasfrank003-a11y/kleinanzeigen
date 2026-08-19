import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { mcpPlugin } from '@lovable.dev/mcp-js/stacks/supabase/vite';

// Served from a project page, so every asset URL needs the repo name in front.
// mcpPlugin bundles src/lib/mcp into the Supabase edge function that serves the
// tools — the same arrangement musical-metrics uses.
export default defineConfig({
  base: '/kleinanzeigen/',
  plugins: [react(), mcpPlugin()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
