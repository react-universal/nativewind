import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';
import vsixPlugin from '@codingame/monaco-vscode-rollup-vsix-plugin';
import assetsJSON from '@entur/vite-plugin-assets-json';
import react from '@vitejs/plugin-react';
// import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  assetsInclude: ['**/*.json', '**/*.wasm'],
  build: {
    target: 'esnext',
    rollupOptions: {
      // logLevel: 'debug',
      shimMissingExports: true,
      // external: ['@rollup/browser'],
      makeAbsoluteExternalsRelative: 'ifRelativeSource',
    },
  },
  resolve: {
    // not needed here, see https://github.com/TypeFox/monaco-languageclient#vite-dev-server-troubleshooting
    // dedupe: ['vscode', '@rollup/browser'],
    alias: {
      globals: path.resolve(__dirname, 'src/internal/globals'),
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
        // NodeGlobalsPolyfillPlugin({
        //   buffer: true,
        //   process: true,
        // }),
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
    react(),
    vsixPlugin(),
    assetsJSON(),
    // {
    //   // For the *-language-features extensions which use SharedArrayBuffer
    //   name: 'configure-response-headers',
    //   apply: 'serve',
    //   configureServer: (server) => {
    //     server.middlewares.use((_req, res, next) => {
    //       res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    //       res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    //       res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    //       next();
    //     });
    //   },
    // },

    // {
    //   name: 'force-prevent-transform-assets',
    //   apply: 'serve',
    //   configureServer(server) {
    //     return () => {
    //       server.middlewares.use(async (req, res, next) => {
    //         if (req.originalUrl != null) {
    //           const pathname = new URL(req.originalUrl, import.meta.url).pathname;
    //           if (pathname.endsWith('.html')) {
    //             res.setHeader('Content-Type', 'text/html');
    //             res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    //             res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    //             res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    //             res.writeHead(200);
    //             res.write(fs.readFileSync(path.join(__dirname, pathname)));
    //             res.end();
    //           }

    //           if (pathname.endsWith('.json')) {
    //             console.log('JSON: ', pathname);
    //             res.setHeader('Content-Type', 'application/json');
    //             res.writeHead(200);
    //             res.write(fs.readFileSync(path.join(__dirname, pathname)));
    //             res.end();
    //           }
    //         }

    //         next();
    //       });
    //     };
    //   },
    // },
  ],
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  define: {
    rootDirectory: JSON.stringify(__dirname),
  },
});
