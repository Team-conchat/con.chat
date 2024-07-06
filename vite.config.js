import { defineConfig } from 'vite';
import babel from '@rollup/plugin-babel';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    testMatch: ['./src/spec/*.spec.jsx'],
  },
  plugins: [
    babel({
      babelHelpers: 'bundled',
      presets: ['@babel/preset-env'],
      plugins: [
        '@babel/plugin-proposal-private-methods',
        '@babel/plugin-proposal-class-properties',
      ],
    }),
  ],
});
