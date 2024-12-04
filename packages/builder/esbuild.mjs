import esbuild from 'esbuild';
import minimist from 'minimist';
import path from 'path';

const args = minimist(process.argv.slice(2), {
  boolean: ['watch', 'minify'],
});

esbuild
  .context({
    entryPoints: [path.join(process.cwd(), './src/main.ts')],
    outdir: 'build',
    sourcemap: 'external',
    sourcesContent: true,
    minifySyntax: false,
    platform: 'node',
    format: 'esm',
    logLevel: 'info',
    bundle: true,
    external: [
      'esbuild',
      'tsup',
      '@babel/*',
      'rollup',
      "ts-morph",
      'typescript',
      'rollup-plugin-dts',
      '@rollup/plugin-terser',
      '@rollup/plugin-typescript',
      'glob',
    ],
    minify: false,
  })
  .then(async (x) => {
    await x.rebuild();
    if (args.watch) {
      return x.watch();
    }
    x.dispose();
  });
