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

const ctxServer = await esbuild.context({
  entryPoints: ['./src/index.ts'],
  bundle: true,
  outdir: 'build',
  external: ['vscode'],
  format: 'cjs',
  logLevel: 'silent',
  platform: 'node',
  sourcemap: true,
  minify: true,
});

console.log('- Building');
// await ctxBIN.rebuild();
await ctxServer.rebuild();

if (args.watch) {
  console.log('- Watching');
  // await ctxBIN.watch();
  await ctxServer.watch();
} else {
  console.log('- Cleaning up');
  // await ctxBIN.dispose();
  await ctxServer.dispose();
}
