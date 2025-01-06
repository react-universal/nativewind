import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import tsPlugin from '@rollup/plugin-typescript';
import { builtinModules } from 'module';
import { defineConfig } from 'rollup';

const allExternal = [...builtinModules, ...builtinModules.map((m) => `node:${m}`)];

export default defineConfig({
  external: [
    'fsevents',
    'vite',
    '@babel/types',
    '@babel/generator',
    '@babel/traverse',
    'fast-check',
    'pure-rand',
    'glob',
    'sucrase',
    ...allExternal,
  ],
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
      extensions: ['.js', '.json', '.node'],
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
