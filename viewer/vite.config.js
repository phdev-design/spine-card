import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: path.resolve(__dirname, '..'),
  publicDir: false,
  server: {
    port: 5173,
    open: '/viewer/index.html',
  },
});
