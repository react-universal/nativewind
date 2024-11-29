import * as Effect from 'effect/Effect';
import { dtsPlugin } from './esbuild-dts.plugin.js';
import { requireResolvePlugin } from './esbuild.requireResolve.plugin.js';

export const getEsBuildPlugins = () =>
  Effect.gen(function* () {
    const dts = yield* dtsPlugin({
      tsconfig: 'tsconfig.build.json',
    });
    return [dts, requireResolvePlugin()];
  });
