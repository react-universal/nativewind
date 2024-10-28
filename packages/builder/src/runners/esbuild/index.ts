import * as Effect from 'effect/Effect';
import { esbuildBuild, esbuildWatch } from './twin.esbuild';

export class EsbuildRunner extends Effect.Service<EsbuildRunner>()('EsbuildRunner', {
  effect: Effect.gen(function* () {
    return {
      build: esbuildBuild,
      watch: esbuildWatch,
    };
  }),
}) {}
