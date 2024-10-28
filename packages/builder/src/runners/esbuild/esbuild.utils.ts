import * as Path from '@effect/platform/Path';
import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { pipe } from 'effect/Function';
import esbuild from 'esbuild';
import { bundlerExternals } from '../../config/constants';
import { BuilderConfig } from '../../services/Builder.service';
import { getEsBuildPlugins } from './plugins';

const resolveExtensions = ['.ts', '.js', '.tsx', '.jsx', '.cjs', '.mjs'];

const externals = bundlerExternals.map((x) => {
  if (typeof x === 'string') {
    return x;
  }
  return x.source
    .replace('^', '*')
    .replace('\\/', '/')
    .replace('(.*)', '*')
    .replace(/^\*/, '');
});

export function getEsbuildConfig(
  format: esbuild.BuildOptions['format'],
  entries: { in: string; out: string }[],
  config: BuilderConfig['Type'],
) {
  return Effect.gen(function* () {
    const path = yield* Path.Path;
    const plugins = yield* getEsBuildPlugins();
    const configs: esbuild.BuildOptions[] = [];
    const extraExternals = pipe([...externals, ...config.external], RA.dedupe);
    let logs: esbuild.LogLevel = 'silent';
    if (typeof config.logs === 'boolean' && config.logs) {
      logs = 'info';
    }
    if (typeof config.logs === 'string') {
      logs = config.logs;
    }

    const outDir = path.join(process.cwd(), `build${format === 'esm' ? '/esm' : ''}`);
    const sharedSettings: esbuild.BuildOptions = {
      entryPoints: entries,
      resolveExtensions,
      external: extraExternals,
      logLevel: logs ?? 'silent',
      minify: config.minify,
      sourcemap: true,
      color: true,
      bundle: true,
      entryNames: '[dir]/[name]',
      conditions: ['main', 'module', 'exports'],
      outdir: outDir,
      mainFields: ['module', 'main', 'browser'],
      platform: config.platform,
      metafile: true,
      format,
      plugins,
    };

    configs.push(sharedSettings);
    if (config.reactNative) {
      configs.push({
        ...sharedSettings,
        resolveExtensions: [
          '.web.js',
          '.web.cjs',
          '.web.jsx',
          '.web.ts',
          '.web.tsx',
          '.web.mjs',
          ...resolveExtensions,
        ],
        entryNames: '[dir]/[name].web',
        format,
      });
    }

    return configs;
  });
}

export function createEsbuildContext(...args: esbuild.BuildOptions[]) {
  return pipe(
    args,
    RA.map((x) => Effect.promise(() => esbuild.context(x))),
  );
}
