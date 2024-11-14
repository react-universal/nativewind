import vsixPlugin from '@codingame/monaco-vscode-rollup-vsix-plugin';
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';
import assetsJSON from '@entur/vite-plugin-assets-json';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import * as fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// const pkg = JSON.parse(
//   fs.readFileSync(new URL('./package.json', import.meta.url).pathname).toString(),
// );

// const localDependencies = Object.entries(pkg.dependencies as Record<string, string>)
//   .filter(([name]) => name.startsWith('@codingame'))
//   .map(([name]) => name);

export default defineConfig({
  assetsInclude: ['**/*.json', '**/*.wasm'],
  build: {
    target: 'esnext',
  },
  esbuild: {
    minifySyntax: false,
  },
  publicDir: 'public',
  worker: {
    format: 'es',
  },
  logLevel: 'info',
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
  resolve: {
    dedupe: ['vscode'],
    alias: {
      //   '@babel/core': path.join(__dirname, './remaps/core'),
      '@babel/generator': path.join(__dirname, './remaps/generator'),
      //   '@babel/template': path.join(__dirname, './remaps/template'),
      //   '@babel/traverse': path.join(__dirname, './remaps/traverse'),
      //   '@babel/types': path.join(__dirname, './remaps/types'),
      //   picomatch: 'picomatch-browser',
    },
  },
  define: {
    rootDirectory: JSON.stringify(__dirname),
  },
  optimizeDeps: {
    include: [
      // add all local dependencies...
      // and their exports
      'vscode/extensions',
      'vscode/services',
      'vscode/monaco',
      'vscode/localExtensionHost',

      // These 2 lines prevent vite from reloading the whole page when starting a worker (so 2 times in a row after cleaning the vite cache - for the editor then the textmate workers)
      // it's mainly empirical and probably not the best way, fix me if you find a better way
      'vscode-textmate',
      'vscode-oniguruma',
      '@vscode/vscode-languagedetection',
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
        __DEV__: 'true',
        // process: JSON.stringify({ env: {} }),
      },
      plugins: [
        // @ts-expect-error
        importMetaUrlPlugin,
      ],
      tsconfig: './tsconfig.build.json',
    },
  },

  plugins: [
    nodePolyfills({
      include: ['path', 'process'],
      globals: {
        Buffer: true,
        process: true,
      },
    }),
    tsconfigPaths(),
    vsixPlugin(),
    assetsJSON(),
    {
      // For the *-language-features extensions which use SharedArrayBuffer
      name: 'configure-response-headers',
      apply: 'serve',
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          next();
        });
      },
    },
    {
      name: 'force-prevent-transform-assets',
      apply: 'serve',
      configureServer(server) {
        return () => {
          server.middlewares.use(async (req, res, next) => {
            if (req.originalUrl != null) {
              const pathname = new URL(req.originalUrl, import.meta.url).pathname;
              if (pathname.endsWith('.html')) {
                res.setHeader('Content-Type', 'text/html');
                res.writeHead(200);
                res.write(fs.readFileSync(path.join(__dirname, pathname)));
                res.end();
              }
            }

            next();
          });
        };
      },
    },
    {
      name: 'log clear',
      
      onLog(level, log) {
        
      },
    }
  ],
});
