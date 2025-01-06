import esbuild from 'esbuild';
import minimist from 'minimist';

const args = minimist(process.argv.slice(2), {
  boolean: ['watch', 'minify'],
});

const ctxServer = await esbuild.context({
  entryPoints: ['./src/index.ts', './src/browser.ts'],
  bundle: true,
  outdir: 'build',
  external: ['vscode'],
  tsconfig: 'tsconfig.build.json',
  format: 'cjs',
  logLevel: 'info',
  platform: 'node',
  sourcemap: true,
  minify: false,
});

console.log('- Building');
await ctxServer.rebuild();

if (args.watch) {
  console.log('- Watching');
  await ctxServer.watch().then(() => {
    console.log('WATCH_FINALIZE');
  });
} else {
  console.log('- Cleaning up');
  await ctxServer.dispose();
}
