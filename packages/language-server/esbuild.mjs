// const production = process.argv[2] === '--production';
import esbuild from 'esbuild';
import minimist from 'minimist';

const args = minimist(process.argv.slice(2), {
  boolean: ['watch', 'minify'],
});

console.log('- Preparing');
// const ctxBIN = await esbuild.context({
//   entryPoints: ['./src/index.ts'],
//   bundle: true,
//   outfile: 'bin/native-twin-language-server',
//   external: ['vscode'],
//   format: 'cjs',
//   logLevel: 'info',
//   platform: 'node',
//   sourcemap: 'both',
//   minify: true,
// });

const context = await esbuild.context({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  outdir: 'build',
  external: ['vscode'],
  format: 'cjs',
  logLevel: 'silent',
  metafile: true,
  platform: 'node',
  sourcemap: true,
  minify: true,
});
console.log('- Building');
await context.rebuild();

if (args.watch) {
  console.log('- Watching');
  await context.watch().then(() => {
    console.log('WATCH_FINALIZE');
  });
} else {
  console.log('- Cleaning up');
  await context.dispose();
}
