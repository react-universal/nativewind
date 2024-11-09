import * as Effect from 'effect/Effect';
import { rollupBuild } from './rollup.builder';
import { rollupWatcher } from './rollup.watcher';

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
