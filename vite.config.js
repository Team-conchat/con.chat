import { defineConfig } from 'vite';
import babel from '@rollup/plugin-babel';
import { version } from './package.json';

export default defineConfig({
  server: {
    port: 3000,
    open: true,
  },
  build: {
    rollupOptions: {
      input: ['./main.js'],
      output: {
        entryFileNames: `v${version}/assets/[name].js`,
        chunkFileNames: `v${version}/assets/[name]-[hash].js`,
        assetFileNames: `v${version}/assets/[name].[ext]`,
      },
    },
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
