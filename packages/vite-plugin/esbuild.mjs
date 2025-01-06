import esbuild from 'esbuild';
import minimist from 'minimist';
import path from 'path';

const args = minimist(process.argv.slice(2), {
  boolean: ['watch', 'minify'],
});

esbuild
  .context({
    entryPoints: [
      path.join(process.cwd(), './src/index.ts'),
    ],
    outdir: 'build',
    sourcemap: true,
    platform: 'node',
    format: 'esm',
    logLevel: 'info',
    bundle: true,
    treeShaking: true,
    external: ['vite', 'effect/*', '@effect/*', '@babel/*'],
    minify: false,
  })
  .then(async (x) => {
    await x.rebuild();
    if (args.watch) {
      return x.watch();
    }
    x.dispose();
  });
