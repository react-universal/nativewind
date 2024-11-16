import vsixPlugin from '@codingame/monaco-vscode-rollup-vsix-plugin';
import assetsJSON from '@entur/vite-plugin-assets-json';
import react from '@vitejs/plugin-react';
import * as fs from 'fs';
import path from 'path';
import { createLogger, defineConfig, UserConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import tsconfigPaths from 'vite-tsconfig-paths';
import nativeTwinVite from '@native-twin/vite-plugin';
import { esbuildPluginMetaUrl } from './remaps/esbuild.plugins/plugin-import-meta';

const pkg = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url).pathname).toString(),
);

const localDependencies = Object.entries(pkg.dependencies as Record<string, string>)
  .filter(([name]) => name.startsWith('@native-twin'))
  .map(([name]) => name);

export default defineConfig((): UserConfig => {
  const logger = createLogger('info');
  return {
    assetsInclude: ['**/*.json', '**/*.wasm'],
    customLogger: {
      ...logger,
      warn(msg, options) {
        if (msg.includes('source map')) {
          return;
        }
        logger.warn(msg, options);
      },
    },
    build: {
      target: 'esnext',
      sourcemap: true,
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
      dedupe: ['vscode', 'effect/**/*.js', '@effect/**/*.js', ...localDependencies],
      alias: {
        //   '@babel/core': path.join(__dirname, './remaps/core'),
        // '@babel/generator': path.join(__dirname, './remaps/generator'),
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
        // prevent vite from reloading the whole page when starting a worker (so 2 times in a row after cleaning the vite cache - for the editor then the textmate workers)
        // it's mainly empirical and probably not the best way, fix me if you find a better way
        'vscode-textmate',
        'vscode-oniguruma',

        '@effect/platform-browser/BrowserWorkerRunner',
        '@effect/platform/WorkerRunner',
        'vscode-languageserver-textdocument',
        'vscode-languageserver/browser.js',
      ],
      esbuildOptions: {
        define: {
          global: 'globalThis',
          __DEV__: 'true',
          // process: JSON.stringify({ env: {} }),
        },
        plugins: [esbuildPluginMetaUrl],
        tsconfig: './tsconfig.build.json',
      },
    },

    plugins: [
      react(),
      nodePolyfills({
        include: ['process'],
      }),
      tsconfigPaths(),
      vsixPlugin(),
      assetsJSON(),
      nativeTwinVite({
        inputCSS: '',
        outputCSS: 'public/output.css',
        twinConfigPath: './tailwind.config.ts',
      }),
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
                  console.log('URL: ', pathname);
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
    ],
  };
});
