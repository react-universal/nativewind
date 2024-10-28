import * as Console from 'effect/Console';
import * as Effect from 'effect/Effect';
import * as Fiber from 'effect/Fiber';
import { pipe } from 'effect/Function';
import * as Stream from 'effect/Stream';
import { BuilderConfig } from '../services/Builder.service';
import { EsbuildRunner } from './esbuild';
import { RollupRunner } from './rollup';
import { BuildRunnersMainLive } from './runners.make';

const program = Effect.gen(function* () {
  const config = yield* BuilderConfig;
  const rollupRunner = yield* RollupRunner;
  const esbuildRunner = yield* EsbuildRunner;

  const buildRunner = config.runner === 'rollup' ? rollupRunner : esbuildRunner;
  const runner = yield* config.watch ? buildRunner.watch : buildRunner.build;

  const runnerStream = runner.pipe(Stream.runForEach((x) => Console.log(x, '\n')));

  if (config.watch) {
    const latch = yield* pipe(runnerStream, Effect.fork);
    yield* pipe(latch, Fiber.await);
    return;
  }
  yield* runnerStream;
});

export const buildCommandHandler = program.pipe(Effect.provide(BuildRunnersMainLive));
