import path from 'path';
import { defineConfig } from 'vite';

console.log('ENV: ', process.env.NODE_ENV);
export default defineConfig({
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    lib: {
      entry: path.resolve(__dirname, 'tailwind/index.ts'),
      name: '@react-universal/core/tailwind',
      formats: ['cjs'],
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      makeAbsoluteExternalsRelative: 'ifRelativeSource',
      external: ['postcss', 'postcss-js', /tailwindcss/, /next/],
      output: {
        dir: 'build/tailwind',
        format: 'cjs',
        esModule: false,
        externalImportAssertions: true,
      },
    },
    sourcemap: true,
  },
});
