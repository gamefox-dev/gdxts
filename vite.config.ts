import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig(({ command, mode }) => {
  if (command === 'serve' || mode === 'demo') {
    return {
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
    };
  }

  return {
    publicDir: false,
    build: {
      emptyOutDir: true,
      lib: {
        entry: resolve(__dirname, 'src/lib/index.ts'),
        formats: ['es', 'cjs'],
        fileName: (format) => (format === 'es' ? 'gdxts.js' : 'gdxts.cjs')
      },
      rollupOptions: {
        external: ['events']
      },
      sourcemap: true,
      target: 'es2018'
    }
  };
});
