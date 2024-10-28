import * as RA from 'effect/Array';
import * as Effect from 'effect/Effect';
import { compose, pipe } from 'effect/Function';
import * as Option from 'effect/Option';
import * as Stream from 'effect/Stream';
import * as Tuple from 'effect/Tuple';
import * as rollup from 'rollup';
import {
  maybeOutputChunk,
  serializeBuildResult,
  serializeOutputChunks,
} from './plugins/analyzer.plugin';
import { createRollupConfig, rollupDefaultConfigs } from './rollup.config';

type UniqueOutput = Exclude<
  rollup.RollupOptions['output'],
  Array<rollup.RollupOptions['output']> | undefined
>;

export const rollupBuild = Effect.gen(function* () {
  const offerResult = (_message: string) => {
    console.log(`${_message}\n`);
  };

  const plugin: rollup.Plugin = {
    name: 'twin-builder',
    writeBundle(outputConfig) {
      return offerResult(`[twin-builder] Build Generated (${outputConfig.format}):`);
    },
    buildEnd(error) {
      if (error) {
        return offerResult(`[twin-builder] Build finish with errors: ${error.message}`);
      }
    },
    closeBundle() {
      return offerResult(`[twin-builder] Bundle closed`);
    },
    generateBundle() {
      return offerResult(`[twin-builder] Generated Bundle`);
    },
  };

  const rollupConfigs = yield* Effect.sync(() =>
    createRollupConfig(rollupDefaultConfigs, [plugin]),
  );

  return Stream.fromIterable(rollupConfigs).pipe(
    Stream.mapEffect((options) => execRollup(options)),
    Stream.flatMap((x) => generateRollupBuild(x)),
  );
});

const execRollup = (options: rollup.RollupOptions) =>
  Effect.promise<[config: UniqueOutput, result: rollup.RollupBuild]>(() =>
    Option.liftPredicate(options.output, (x): x is UniqueOutput => {
      return typeof x !== 'undefined' && !Array.isArray(x);
    }).pipe(Option.getOrThrow, (output) =>
      rollup.rollup(options).then((x) => Tuple.make(output, x)),
    ),
  );

export const generateRollupBuild = (
  build: [config: UniqueOutput, result: rollup.RollupBuild],
) => {
  const [config, result] = build;
  return pipe(
    Stream.fromEffect(Effect.promise(() => result.write(config))),
    Stream.map((x) => RA.filterMap(x.output, maybeOutputChunk)),
    Stream.map((x) => compose(serializeOutputChunks, serializeBuildResult)(x)),
    Stream.map((x) => {
      return `Build finished (${config.format}):\n ${x} \n`;
    }),
    Stream.tap(() => Effect.promise(() => result.close())),
  );
};
