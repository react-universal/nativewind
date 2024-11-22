import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import tsPlugin from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';

export default defineConfig({
  external: ['vite'],
  treeshake: false,
  input: 'src/index.ts',
  plugins: [
    nodeResolve({
      browser: false,
      preferBuiltins: true,
      mainFields: ['exports', 'module', 'main'],
    }),
    json(),
    commonjs({
      extensions: ['.js', '.json'],
      ignoreDynamicRequires: false,
      transformMixedEsModules: true,
      esmExternals: true,
      requireReturnsDefault: 'preferred',
    }),
    tsPlugin({
      tsconfig: './tsconfig.json',
    }),
  ],
  output: {
    interop: 'auto',
    esModule: true,
    exports: 'auto',
    sourcemap: true,
    inlineDynamicImports: false,
    format: 'esm',
    dynamicImportInCjs: false,
    file: './build/index.js',
  },
  shimMissingExports: false,
});
