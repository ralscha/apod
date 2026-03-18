import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const serviceWorkerEntry = resolve(import.meta.dirname, 'src/service-worker.ts');

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const nodeEnv = isProduction ? 'production' : 'development';

  return {
    define: {
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    },
    publicDir: false,
    build: {
      cssCodeSplit: false,
      emptyOutDir: false,
      lib: {
        entry: serviceWorkerEntry,
        fileName: () => 'service-worker.js',
        formats: ['iife'],
        name: 'apodServiceWorker',
      },
      minify: isProduction ? 'esbuild' : false,
      outDir: resolve(import.meta.dirname, isProduction ? 'dist/app' : 'src'),
      reportCompressedSize: false,
      sourcemap: !isProduction,
      target: 'es2022',
    },
  };
});
