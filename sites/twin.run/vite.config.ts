import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';
import vsixPlugin from '@codingame/monaco-vscode-rollup-vsix-plugin';
import assetsJSON from '@entur/vite-plugin-assets-json';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  assetsInclude: ['**/*.json', '**/*.wasm'],
  build: {
    rollupOptions: {
      shimMissingExports: true,
      makeAbsoluteExternalsRelative: 'ifRelativeSource',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
        __DEV__: 'true',
      },
      plugins: [
        // @ts-expect-error
        importMetaUrlPlugin,
      ],
    },
  },
  publicDir: 'public',
  worker: {
    format: 'es',
  },

  plugins: [
    nodePolyfills({
      include: ['path', 'buffer', 'process'],
      globals: {
        Buffer: true,
        process: true,
      },
    }),
    tsconfigPaths(),
    vsixPlugin(),
    assetsJSON(),
  ],
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  define: {
    rootDirectory: JSON.stringify(__dirname),
  },
});
