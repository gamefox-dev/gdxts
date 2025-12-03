import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'build',
    sourcemap: true
  },
  server: {
    port: 3000,
    open: true
  }
});
