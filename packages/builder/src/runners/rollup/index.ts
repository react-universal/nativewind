import * as Effect from 'effect/Effect';
import { rollupBuild } from './rollup.builder.js';
import { rollupWatcher } from './rollup.watcher.js';

export class RollupRunner extends Effect.Service<RollupRunner>()('RollupRunner', {
  effect: Effect.gen(function* () {
    const builder = rollupBuild;
    const watch = rollupWatcher;

    return {
      build: builder,
      watch: watch,
    };
  }),
}) {}
